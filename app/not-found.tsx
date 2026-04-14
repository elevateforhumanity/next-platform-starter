import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-4 text-gray-600">The page you requested does not exist.</p>
      <Link href="/" className="mt-6 inline-block underline">
        Return home
      </Link>
    </section>
  );
}
