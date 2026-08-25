import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getPost, getSlugs } from "@/lib/posts";
import { locales } from "@/lib/locales";
import { siteConfig } from "@/lib/site";
import type { Metadata } from "next";

export function generateStaticParams() {
  const slugs = getSlugs();
  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const post = getPost(params.locale, params.slug);
  if (!post) {
    return { title: siteConfig.defaultTitle };
  }
  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    alternates: {
      canonical: `${siteConfig.siteUrl}/${params.locale}/guide/${post.slug}`,
    },
  };
}

// 检查 hero 配图是否已存在于 public 目录（未准备时优雅降级）。
function heroImageExists(src: string): boolean {
  if (!src.startsWith("/")) return false;
  const file = path.join(process.cwd(), "public", src);
  return fs.existsSync(file);
}

export default function GuidePage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const post = getPost(params.locale, params.slug);
  if (!post) notFound();

  const fm = post.frontmatter;
  const hasHero = fm.heroImage ? heroImageExists(fm.heroImage) : false;

  return (
    <article className="guide">
      <header className="guide-header">
        <span className="eyebrow">{fm.eyebrow}</span>
        <h1>{fm.title}</h1>
      </header>
      {hasHero && (
        <img
          className="guide-hero"
          src={fm.heroImage}
          alt={fm.heroAlt || fm.title}
        />
      )}
      <div className="guide-body">
        {fm.sourceUrl && (
          <div className="guide-source">
            来源：
            <a href={fm.sourceUrl} target="_blank" rel="noopener noreferrer">
              {fm.sourceLabel || "官方"}
            </a>
          </div>
        )}
        <div className="prose">
          <MDXRemote
            source={post.content}
            options={{
              // remark-gfm@4 需配合 next-mdx-remote@6（内部 @mdx-js/mdx@3，unified@11 生态）。
              // 断言 any 以防传递依赖类型路径不一致（运行时无影响）。
              mdxOptions: { remarkPlugins: [remarkGfm as any] },
            }}
          />
        </div>
      </div>
    </article>
  );
}
