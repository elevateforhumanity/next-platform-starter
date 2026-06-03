import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

export interface ProgramHolderStudent {
  student_id: string;
  student_name: string;
  student_email: string;
  course_id: string;
  course_title: string;
  enrollment_status: string;
  progress: number;
  enrolled_at: string;
}

export async function assignProgramToHolder(
  holderId: string,
  programSlug: string,
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('assign_program_to_holder', {
    p_holder_id: holderId,
    p_program_slug: programSlug,
  });

  if (error) {
    logger.error('Error assigning program to holder:', error);
    return null;
  }

  return data;
}

export async function getProgramHolderStudents(holderId: string): Promise<ProgramHolderStudent[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_program_holder_students', {
    p_holder_id: holderId,
  });

  if (error) {
    logger.error('Error fetching program holder students:', error);
    return [];
  }

  return data || [];
}

export async function getProgramHolderPrograms(holderId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('program_holder_programs')
    .select('*')
    .eq('program_holder_id', holderId);

  if (error) {
    logger.error('Error fetching program holder programs:', error);
    return [];
  }

  return data || [];
}

export async function canAccessStudent(holderId: string, studentId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: roster } = await supabase
    .from('program_holder_students')
    .select('id')
    .eq('program_holder_id', holderId)
    .eq('user_id', studentId)
    .maybeSingle();

  if (roster) return true;

  const { data: programs } = await supabase
    .from('program_holder_programs')
    .select('program_id')
    .eq('program_holder_id', holderId)
    .eq('status', 'active');

  const programIds = (programs ?? []).map((p) => p.program_id).filter(Boolean);
  if (!programIds.length) return false;

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id')
    .eq('user_id', studentId)
    .in('program_id', programIds)
    .limit(1)
    .maybeSingle();

  return Boolean(enrollment);
}
