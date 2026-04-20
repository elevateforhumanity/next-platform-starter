import Link from 'next/link';
import { siteConfig } from '@/content/site';

export function SiteHeader() {
  const primary = siteConfig.nav.slice(0, 5);
  const more = siteConfig.nav.slice(5);

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-semibold text-lg">
          {siteConfig.name}
        </Link>

        <nav className="hidden gap-6 md:flex items-center">
          {primary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {item.label}
            </Link>
          ))}
          <div className="group relative">
            <button className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
              More ▾
            </button>
            <div className="absolute left-0 top-full z-50 hidden w-56 rounded border bg-white shadow-lg group-hover:block">
              {more.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="flex gap-3">
          <a
            href={siteConfig.handoff.login}
            className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Student Login
          </a>
          <a
            href={siteConfig.handoff.apply}
            className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            Apply Now
          </a>
        </div>
      </div>
    </header>
  );
}
