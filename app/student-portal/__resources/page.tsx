import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  BookOpen, Users, FileText, Briefcase, Monitor, Download,
  DollarSign, MessageCircle, ExternalLink, ChevronRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Resources | Student Portal',
  description: 'Academic, career, and support resources for Elevate for Humanity students.',
  robots: { index: false, follow: false },
};

// Icon map — DB stores icon name as string
const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen, Users, FileText, Briefcase, Monitor, Download,
  DollarSign, MessageCircle,
};

const CATEGORY_LABELS: Record<string, string> = {
  academic:  'Academic Support',
  career:    'Career Services',
  financial: 'Financial Resources',
  technical: 'Technical Support',
  general:   'General Resources',
};

const CATEGORY_ORDER = ['academic', 'career', 'financial', 'technical', 'general'];

// Fallback if table not yet populated
const FALLBACK_RESOURCES = [
  { id: '1', title: 'Digital Library',   description: 'Access thousands of textbooks, journals, and study materials', category: 'academic',  icon: 'BookOpen',      href: '/lms/library',    external: false, badge: null },
  { id: '2', title: 'Tutoring Center',   description: 'One-on-one and group tutoring with certified tutors',          category: 'academic',  icon: 'Users',         href: '/tutoring',       external: false, badge: 'Free' },
  { id: '3', title: 'Writing Center',    description: 'Feedback on essays, reports, and professional documents',      category: 'academic',  icon: 'FileText',      href: '/writing-center', external: false, badge: 'Free' },
  { id: '4', title: 'Career Services',   description: 'Resume help, interview prep, and job placement assistance',    category: 'career',    icon: 'Briefcase',     href: '/career-services',external: false, badge: null },
  { id: '5', title: 'IT Help Desk',      description: 'Technical support for LMS access, software, and devices',     category: 'technical', icon: 'Monitor',       href: '/lms/help',       external: false, badge: null },
  { id: '6', title: 'Study Materials',   description: 'Download practice tests, flashcards, and study guides',       category: 'academic',  icon: 'Download',      href: '/lms/files',      external: false, badge: null },
  { id: '7', title: 'Financial Aid',     description: 'Scholarships, grants, and payment plan information',           category: 'financial', icon: 'DollarSign',    href: '/financial-aid',  external: false, badge: null },
  { id: '8', title: 'Student Community', description: 'Connect with classmates and join study groups',               category: 'general',   icon: 'MessageCircle', href: '/lms/community',  external: false, badge: null },
];

export default async function StudentPortalResourcesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/student-portal/resources');

  const { data: dbResources } = await supabase
    .from('student_resources')
    .select('id, title, description, category, icon, href, external, badge, display_order')
    .eq('active', true)
    .order('display_order', { ascending: true });

  const resources = (dbResources && dbResources.length > 0) ? dbResources : FALLBACK_RESOURCES;

  // Group by category
  const grouped = CATEGORY_ORDER.reduce<Record<string, typeof resources>>((acc, cat) => {
    const items = resources.filter((r: any) => r.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  // Any categories not in CATEGORY_ORDER
  resources.forEach((r: any) => {
    if (!CATEGORY_ORDER.includes(r.category) && !grouped[r.category]) {
      grouped[r.category] = resources.filter((x: any) => x.category === r.category);
    }
  });

  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/student-portal-page-6.jpg" alt="Student resources" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-slate-900/40" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 w-full">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Student Resources</h1>
            <p className="text-white/80 text-sm mt-1">Everything you need to succeed in your program</p>
          </div>
        </div>
      </section>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Student Portal', href: '/student-portal' }, { label: 'Resources' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category}>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-brand-blue-500 rounded-full inline-block" />
              {CATEGORY_LABELS[category] ?? category}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((resource: any) => {
                const Icon = ICON_MAP[resource.icon] ?? BookOpen;
                return (
                  <Link
                    key={resource.id}
                    href={resource.href}
                    target={resource.external ? '_blank' : undefined}
                    rel={resource.external ? 'noopener noreferrer' : undefined}
                    className="group bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-brand-blue-200 transition-all flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-brand-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand-blue-100 transition-colors">
                        <Icon className="w-5 h-5 text-brand-blue-600" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {resource.badge && (
                          <span className="px-2 py-0.5 bg-brand-green-100 text-brand-green-700 text-xs font-semibold rounded-full">
                            {resource.badge}
                          </span>
                        )}
                        {resource.external
                          ? <ExternalLink className="w-3.5 h-3.5 text-slate-700" />
                          : <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-brand-blue-500 transition-colors" />}
                      </div>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm mb-1 group-hover:text-brand-blue-700 transition-colors">
                      {resource.title}
                    </h3>
                    {resource.description && (
                      <p className="text-xs text-slate-700 leading-relaxed flex-1">{resource.description}</p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        {/* Quick contact strip */}
        <section className="bg-brand-blue-50 rounded-2xl border border-brand-blue-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-brand-blue-900">Can&apos;t find what you need?</h3>
            <p className="text-sm text-brand-blue-700 mt-0.5">Student services is here to help.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <a href="tel:+13173143757" className="inline-flex items-center gap-2 bg-white border border-brand-blue-200 text-brand-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-blue-100 transition-colors">
              (317) 314-3757
            </a>
            <Link href="/contact" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-blue-700 transition-colors">
              Contact Us <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
