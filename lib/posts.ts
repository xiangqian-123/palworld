import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { CONTENT_FALLBACK } from "@/lib/locales";

export const CONTENT_DIR = path.join(process.cwd(), "content", "guides");

export interface PostFrontmatter {
  title: string;
  description: string;
  eyebrow: string;
  heroImage: string;
  heroAlt: string;
  sourceLabel: string;
  sourceUrl: string;
  order: number;
  published: boolean;
}

export interface Post {
  slug: string;
  locale: string; // 实际命中的语言（可能是回退后的）
  frontmatter: PostFrontmatter;
  content: string;
}

// 以 zh-CN（源语言）为准列出全部 slug。
export function getSlugs(): string[] {
  const dir = path.join(CONTENT_DIR, "zh-CN");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""))
    .sort();
}

// 读取单篇文章，按回退链（本语言 → en → zh-CN）查找。
export function getPost(locale: string, slug: string): Post | null {
  const chain = [locale, ...CONTENT_FALLBACK];
  for (const loc of chain) {
    const file = path.join(CONTENT_DIR, loc, `${slug}.mdx`);
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, "utf8");
      const { data, content } = matter(raw);
      return {
        slug,
        locale: loc,
        frontmatter: data as PostFrontmatter,
        content,
      };
    }
  }
  return null;
}

// 某语言下的全部文章（用于导航/列表），按 order 排序。
export function getPostsByLocale(locale: string): Post[] {
  return getSlugs()
    .map((slug) => getPost(locale, slug))
    .filter((p): p is Post => p !== null && p.frontmatter.published !== false)
    .sort((a, b) => a.frontmatter.order - b.frontmatter.order);
}
