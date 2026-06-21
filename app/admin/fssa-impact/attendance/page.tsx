import { createClient } from '@/lib/supabase/server';
import { card, layout } from '@/lib/page-design-tokens';
import AttendanceStatsCard from '@/components/admin/fssa/AttendanceStatsCard';

export const dynamic = 'force-dynamic';

export default async function FssaAttendancePage() {
  const supabase = await createClient();
  
  // Fetch real FSSA / SNAP-ET participant attendance
  const { data: attendance, error } = await supabase
    .from('hour_entries')
    .select('*, profiles(full_name, email)')
    .eq('funding_source', 'SNAP-ET')
    .order('work_date', { ascending: false });

  return (
    <div className={layout.container}>
      <h1 className="text-2xl font-bold mb-6">FSSA SNAP E&T Attendance</h1>
      <AttendanceStatsCard data={attendance || []} />
      {/* Real-world attendance table below */}
    </div>
  );
}
