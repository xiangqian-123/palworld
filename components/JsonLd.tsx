/**
 * 渲染 JSON-LD 结构化数据。
 * 放在页面任意位置即可（Next 会原样输出 script 标签）。
 */
export default function JsonLd({ data }: { data: unknown }) {
  if (!data) return null;
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
