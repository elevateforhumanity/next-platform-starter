import Link from 'next/link';
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex text-sm text-gray-500 mb-4">
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          {i > 0 && <span className="mx-2">/</span>}
          {item.href ? <Link href={item.href} className="hover:text-gray-900">{item.label}</Link> : <span>{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
