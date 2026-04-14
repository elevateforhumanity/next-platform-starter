import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPosts, blogCategories } from '@/content/blog';
import { buildMetadata } from '@/lib/seo';

export function generateStaticParams() {
  return blogCategories.map((category) => ({ category: encodeURIComponent(category) }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const decoded = decodeURIComponent(category);
  return buildMetadata({ title: `${decoded} — Blog`, description: `Blog posts in ${decoded}.`, path: `/blog/category/${category}` });
}

export default async function BlogCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const decoded = decodeURIComponent(category);
  const posts = blogPosts.filter((p) => p.category === decoded);
  if (!posts.length) return notFound();

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">{decoded}</h1>
      <div className="mt-10 space-y-8">
        {posts.map((post) => (
          <article key={post.slug} className="border-b pb-8">
            <p className="text-sm text-gray-400">{post.date}</p>
            <h2 className="mt-1 text-xl font-semibold">{post.title}</h2>
            <p className="mt-2 text-gray-600">{post.summary}</p>
            <Link href={`/blog/${post.slug}`} className="mt-3 inline-block text-sm underline">Read more</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
