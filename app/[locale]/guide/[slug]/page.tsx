import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getPost, getSlugs } from "@/lib/posts";
import { locales, type Locale } from "@/lib/locales";
import { siteConfig } from "@/lib/site";
import {
  OG_LOCALE,
  absoluteUrl,
  buildAlternates,
  articleJsonLd,
  breadcrumbJsonLd,
  extractFaq,
  faqJsonLd,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
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
  const path = `/guide/${post.slug}`;
  const image = post.frontmatter.heroImage || siteConfig.ogImage;
  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    alternates: buildAlternates(params.locale, path),
    openGraph: {
      type: "article",
      siteName: siteConfig.siteName,
      locale: OG_LOCALE[(params.locale as Locale) ?? "zh-CN"],
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      url: absoluteUrl(`/${params.locale}${path}`),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      images: [image],
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
  const locale = params.locale as Locale;
  const path = `/guide/${post.slug}`;

  // 结构化数据：Article + Breadcrumb，FAQ 页额外输出 FAQPage。
  const faq = faqJsonLd(extractFaq(post.content));

  return (
    <article className="guide">
      <JsonLd
        data={articleJsonLd({
          locale,
          title: fm.title,
          description: fm.description,
          path,
          image: fm.heroImage,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: siteConfig.siteName, path: "" },
          { name: fm.title, path },
        ])}
      />
      {faq && <JsonLd data={faq} />}
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
