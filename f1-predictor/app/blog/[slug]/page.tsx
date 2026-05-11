import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getPostBySlug, getAllSlugs } from "@/lib/blog";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      ...(post.coverImage && {
        images: [{ url: post.coverImage }],
      }),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/blog"
        className="inline-block mb-6 text-sm hover:underline"
        style={{ color: "var(--color-accent)" }}
      >
        ← Back to blog
      </Link>

      <article>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          {post.title}
        </h1>
        <time
          className="block mb-6 text-sm"
          style={{ color: "var(--text-muted)" }}
          dateTime={post.publishedAt}
        >
          {new Date(post.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>

        {post.coverImage && (
          <div className="relative aspect-video rounded-xl overflow-hidden mb-8">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        <div className="prose prose-invert max-w-none prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-primary)] prose-strong:text-[var(--text-primary)] prose-a:text-[var(--color-accent)] prose-a:no-underline hover:prose-a:underline">
          <MDXRemote source={post.content} />
        </div>
      </article>
    </main>
  );
}
