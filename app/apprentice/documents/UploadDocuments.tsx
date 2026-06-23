'use client';

import { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function UploadDocuments({ refreshKey }: { refreshKey?: number }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setError(null);
    setSuccess(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', 'government-id');

    try {
      const res = await fetch('/api/apprentice/documents', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess('Document uploaded successfully!');
      if (refreshKey !== undefined) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${dragActive 
            ? 'border-brand-blue-500 bg-brand-blue-50' 
            : 'border-slate-300 hover:border-brand-blue-400 hover:bg-slate-50'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-brand-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-600">Uploading...</p>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="font-medium text-slate-700">
              Click to upload or drag and drop
            </p>
            <p className="text-sm text-slate-500 mt-1">
              PDF, JPG, or PNG (max 10MB)
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}
    </div>
  );
}
