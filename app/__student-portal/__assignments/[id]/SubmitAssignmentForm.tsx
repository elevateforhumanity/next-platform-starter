'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Upload, Send, Loader2, CheckCircle, AlertCircle, X, FileText } from 'lucide-react';

type Props = {
  assignmentId: string;
  lessonId: string | null;   // null when assignment has no linked curriculum lesson
  courseId: string;
  stepType?: string;
  allowedFileTypes?: string[] | null;
  maxFileSizeMb?: number;
};

export default function SubmitAssignmentForm({
  assignmentId,
  lessonId,
  courseId,
  stepType = 'assignment',
  allowedFileTypes,
  maxFileSizeMb = 10,
}: Props) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const maxBytes = maxFileSizeMb * 1024 * 1024;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const oversized = selected.filter(f => f.size > maxBytes);
    if (oversized.length > 0) {
      setError(`File(s) exceed the ${maxFileSizeMb} MB limit: ${oversized.map(f => f.name).join(', ')}`);
      return;
    }
    setError(null);
    setFiles(prev => [...prev, ...selected]);
    e.target.value = '';
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) {
      setError('Please add a written response or attach at least one file.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      // Upload files to documents bucket
      const fileUrls: string[] = [];
      if (files.length > 0) {
        setUploading(true);
        for (const file of files) {
          const path = `submissions/${user.id}/${assignmentId}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(path, file, { upsert: false });
          if (uploadError) throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
          const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
          fileUrls.push(urlData.publicUrl);
        }
        setUploading(false);
      }

      // Insert step_submission — use lesson_id when available, assignment_id otherwise
      const { error: insertError } = await supabase
        .from('step_submissions')
        .insert({
          user_id: user.id,
          ...(lessonId ? { lesson_id: lessonId } : { assignment_id: assignmentId }),
          course_id: courseId || null,
          step_type: stepType,
          submission_text: text.trim() || null,
          file_urls: fileUrls,
          status: 'submitted',
        });

      if (insertError) throw new Error(insertError.message);

      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Submission failed. Please try again.');
      setUploading(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-brand-green-200 bg-brand-green-50 p-6 text-center">
        <CheckCircle className="w-10 h-10 text-brand-green-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-brand-green-800 mb-1">Submitted successfully</h3>
        <p className="text-sm text-brand-green-700">Your instructor will review your work and provide feedback.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Written response */}
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-1">
          Written Response
        </label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={6}
          placeholder="Describe your work, approach, or findings..."
          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 resize-y"
        />
      </div>

      {/* File upload */}
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-1">
          Attachments <span className="text-slate-700 font-normal">(optional, max {maxFileSizeMb} MB each)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-slate-700 hover:border-brand-blue-400 hover:text-brand-blue-600 transition-colors">
          <Upload className="w-4 h-4" />
          Choose files
          <input
            type="file"
            multiple
            className="hidden"
            accept={allowedFileTypes?.join(',') ?? undefined}
            onChange={handleFileChange}
          />
        </label>

        {files.length > 0 && (
          <ul className="mt-3 space-y-2">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-900 bg-gray-50 rounded-lg px-3 py-2">
                <FileText className="w-4 h-4 text-slate-700 flex-shrink-0" />
                <span className="flex-1 truncate">{f.name}</span>
                <span className="text-slate-700 text-xs flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                <button type="button" onClick={() => removeFile(i)} className="text-slate-700 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 bg-brand-green-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-green-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {uploading ? 'Uploading files…' : 'Submitting…'}
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Assignment
          </>
        )}
      </button>
    </form>
  );
}
