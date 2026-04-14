import { notFound } from 'next/navigation';
import { blogPosts } from '@/content/blog';
import { findBySlug, staticParamsFromSlugs } from '@/lib/content-helpers';
import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/content/site';

export function generateStaticParams() {
  return staticParamsFromSlugs(blogPosts);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = findBySlug(blogPosts, slug);
  if (!post) return {};
  return buildMetadata({ title: post.title, description: post.summary, path: `/blog/${slug}` });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = findBySlug(blogPosts, slug);
  if (!post) return notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm text-gray-400">{post.date} · {post.category} · {post.author}</p>
      <h1 className="mt-2 text-3xl font-bold">{post.title}</h1>
      <p className="mt-4 text-lg text-gray-600">{post.summary}</p>
      <div className="mt-8 text-gray-700">{post.body}</div>
      <div className="mt-10">
        <a href={siteConfig.handoff.apply} className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800">
          Apply Now
        </a>
      </div>
    </article>
  );
}
