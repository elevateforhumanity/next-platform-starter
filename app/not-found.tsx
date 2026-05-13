import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-4 max-w-2xl">
        <div className="mb-8">
          <div className="text-8xl font-black text-slate-700 mb-4">404</div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Page Not Found</h1>
          <p className="text-lg text-slate-700 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>
          <Link
            href="/programs"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-slate-300 text-slate-900 rounded-lg hover:bg-white transition font-semibold"
          >
            <Search className="h-5 w-5" />
            Browse Programs
          </Link>
        </div>

        <div className="text-sm text-slate-700">
          <p>Looking for something specific?</p>
          <Link href="/contact" className="text-brand-blue-600 hover:underline">
            Contact us for help
          </Link>
        </div>
      </div>
    </div>
  );
}
