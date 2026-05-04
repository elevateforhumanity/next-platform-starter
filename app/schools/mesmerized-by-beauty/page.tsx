import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mesmerized by Beauty | Elevate for Humanity',
  robots: { index: false, follow: false },
};

// ARCHIVED: Temporarily unavailable while content is being updated.
export default function MesmerizedByBeautyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Coming Soon</h1>
        <p className="text-slate-600 mb-8">
          This page is temporarily unavailable while we update our content.
          Please check back soon or contact us for more information.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/programs" className="bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors">
            View All Programs
          </Link>
          <a href="tel:+13173143757" className="border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors">
            (317) 314-3757
          </a>
        </div>
      </div>
    </div>
  );
}
