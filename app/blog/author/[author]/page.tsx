import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPosts, blogAuthors } from '@/content/blog';
import { buildMetadata } from '@/lib/seo';

export function generateStaticParams() {
  return blogAuthors.map((author) => ({ author: encodeURIComponent(author) }));
}

export async function generateMetadata({ params }: { params: Promise<{ author: string }> }) {
  const { author } = await params;
  const decoded = decodeURIComponent(author);
  return buildMetadata({ title: `Posts by ${decoded}`, description: `Blog posts by ${decoded}.`, path: `/blog/author/${author}` });
}

export default async function BlogAuthorPage({ params }: { params: Promise<{ author: string }> }) {
  const { author } = await params;
  const decoded = decodeURIComponent(author);
  const posts = blogPosts.filter((p) => p.author === decoded);
  if (!posts.length) return notFound();

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">Posts by {decoded}</h1>
      <div className="mt-10 space-y-8">
        {posts.map((post) => (
          <article key={post.slug} className="border-b pb-8">
            <p className="text-sm text-gray-400">{post.date} · {post.category}</p>
            <h2 className="mt-1 text-xl font-semibold">{post.title}</h2>
            <p className="mt-2 text-gray-600">{post.summary}</p>
            <Link href={`/blog/${post.slug}`} className="mt-3 inline-block text-sm underline">Read more</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
