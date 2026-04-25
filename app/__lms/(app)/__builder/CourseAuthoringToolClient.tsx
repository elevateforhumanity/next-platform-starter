'use client';

import dynamic from 'next/dynamic';

const CourseAuthoringTool = dynamic(
  () => import('@/components/lms/CourseAuthoringTool'),
  { ssr: false, loading: () => <div className="py-12 text-center text-slate-500">Loading builder…</div> }
);

export default function CourseAuthoringToolClient() {
  return <CourseAuthoringTool />;
}
