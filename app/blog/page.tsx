import Link from 'next/link';
import { blogPosts } from '@/content/blog';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Blog',
  description: 'Career insights, funding guides, and workforce news from Elevate for Humanity.',
  path: '/blog',
});

export default function BlogPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">Blog</h1>
      <p className="mt-4 text-gray-600">Career insights, funding guides, and workforce news.</p>
      <div className="mt-10 space-y-8">
        {blogPosts.map((post) => (
          <article key={post.slug} className="border-b pb-8">
            <p className="text-sm text-gray-400">{post.date} · {post.category}</p>
            <h2 className="mt-1 text-xl font-semibold">{post.title}</h2>
            <p className="mt-2 text-gray-600">{post.summary}</p>
            <Link href={`/blog/${post.slug}`} className="mt-3 inline-block text-sm underline">
              Read more
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
