import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "F1 predictions, race previews, strategy tips, and insights from the Grid Guesser community.",
  openGraph: {
    title: "Blog | Grid Guesser",
    description:
      "F1 predictions, race previews, strategy tips, and insights from the Grid Guesser community.",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
        Blog
      </h1>
      <p className="mb-8" style={{ color: "var(--text-secondary)" }}>
        Race previews, prediction tips, and F1 insights and opinions.
      </p>

      {posts.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>No posts yet. Check back soon!</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-xl overflow-hidden transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
            >
              {post.coverImage && (
                <div className="relative aspect-video">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
              )}
              <div className="p-4">
                <h2
                  className="text-lg font-semibold mb-1 group-hover:underline"
                  style={{ color: "var(--text-primary)" }}
                >
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                    {post.excerpt}
                  </p>
                )}
                <time
                  className="block mt-2 text-xs"
                  style={{ color: "var(--text-muted)" }}
                  dateTime={post.publishedAt}
                >
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
