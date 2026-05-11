import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface BlogPostMeta {
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  publishedAt: string;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}

const postsDirectory = path.join(process.cwd(), "content/blog");

export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(postsDirectory)) return [];

  const files = fs.readdirSync(postsDirectory).filter((f) => f.endsWith(".mdx"));

  const posts = files.map((filename) => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data } = matter(fileContents);

    return {
      title: data.title,
      slug: filename.replace(/\.mdx$/, ""),
      excerpt: data.excerpt || "",
      coverImage: data.coverImage || undefined,
      publishedAt: data.publishedAt,
    } as BlogPostMeta;
  });

  return posts.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(postsDirectory, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    title: data.title,
    slug,
    excerpt: data.excerpt || "",
    coverImage: data.coverImage || undefined,
    publishedAt: data.publishedAt,
    content,
  };
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) return [];

  return fs
    .readdirSync(postsDirectory)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}
