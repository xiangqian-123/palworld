/*
 * generate-site.cjs —— 把 AI 生成好的 MDX 批量部署到 content/guides，并生成繁体版。
 *
 * 用法：
 *   node scripts/generate-site.cjs <输入目录> <locale>
 *
 * 示例：
 *   node scripts/generate-site.cjs input/zh-CN zh-CN
 *
 * 输入目录结构（AI 用 templates/prompts/04-页面生成.md 生成，按 slug 命名）：
 *   input/zh-CN/
 *     beginner.mdx
 *     water.mdx
 *     ...
 *
 * 脚本会：
 *   1. 校验每个 .mdx 的 frontmatter 必填字段（缺字段直接报错并列出）
 *   2. 写入 content/guides/<locale>/<slug>.mdx
 *   3. 若 locale 是 zh-CN，用 opencc 自动生成 content/guides/zh-TW/<slug>.mdx
 *   4. 打印部署报告（成功 / 缺失字段 / 跳过的文件）
 */
const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = [
  'title',
  'description',
  'eyebrow',
  'heroImage',
  'heroAlt',
  'sourceLabel',
  'sourceUrl',
  'order',
  'published',
];

function parseFrontmatter(raw) {
  // 极简 frontmatter 解析：--- 开头到第二个 --- 之间的 YAML。
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return fm;
}

function validate(file, fm) {
  if (!fm) return [`${file}: 缺少 frontmatter（--- 包裹的 YAML 头部）`];
  const missing = REQUIRED_FIELDS.filter((f) => !(f in fm));
  return missing.map((f) => `${file}: 缺少必填字段 ${f}`);
}

async function main() {
  const [, , inputDir, locale] = process.argv;
  if (!inputDir || !locale) {
    console.error('用法: node scripts/generate-site.cjs <输入目录> <locale>');
    process.exit(1);
  }

  const srcDir = path.resolve(inputDir);
  const dstDir = path.resolve('content/guides', locale);

  if (!fs.existsSync(srcDir)) {
    console.error(`输入目录不存在: ${srcDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.mdx'));
  if (files.length === 0) {
    console.error(`输入目录里没有 .mdx 文件: ${srcDir}`);
    process.exit(1);
  }

  fs.mkdirSync(dstDir, {recursive: true});

  const errors = [];
  let ok = 0;
  const deployed = [];

  for (const f of files) {
    const raw = fs.readFileSync(path.join(srcDir, f), 'utf8');
    const fm = parseFrontmatter(raw);
    const fileErrors = validate(f, fm);
    if (fileErrors.length > 0) {
      errors.push(...fileErrors);
      continue;
    }
    fs.writeFileSync(path.join(dstDir, f), raw, 'utf8');
    deployed.push(f);
    ok += 1;
  }

  console.log(`\n部署完成: ${ok}/${files.length} 个文件写入 content/guides/${locale}/`);
  if (deployed.length) {
    console.log('已部署:', deployed.join(', '));
  }
  if (errors.length) {
    console.log('\n⚠️ 校验失败（以下文件未部署，请补齐字段后重跑）:');
    for (const e of errors) console.log('  -', e);
  }

  // 简中 → 繁体自动转换
  if (locale === 'zh-CN' && ok > 0) {
    const OpenCC = require('opencc-js');
    const convert = OpenCC.Converter({from: 'cn', to: 'twp'});
    const twDir = path.resolve('content/guides/zh-TW');
    fs.mkdirSync(twDir, {recursive: true});
    let tw = 0;
    for (const f of deployed) {
      const raw = fs.readFileSync(path.join(dstDir, f), 'utf8');
      let out = raw.replace(/\/zh-CN\/guide(\/|(?=[)\s]|$))/g, '/zh-TW/guide$1');
      out = convert(out);
      fs.writeFileSync(path.join(twDir, f), out, 'utf8');
      tw += 1;
    }
    console.log(`\n繁体版: ${tw} 个文件已生成到 content/guides/zh-TW/`);
  }

  if (errors.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
