'use client';

import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import VideoUploader from '@/components/admin/VideoUploader';
import AdvancedVideoUploader from '@/components/admin/AdvancedVideoUploader';
import {
  Check,
  Copy,
  FileText,
  Sparkles,
  Video,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';

interface VideoRecord {
  id: string;
  title: string;
  url: string;
  created_at: string;
  duration_minutes: number | null;
}

interface Props {
  /** When provided, skips the initial fetch and uses these videos instead */
  initialVideos?: VideoRecord[];
  /** When provided, shows an "Attach" button on each video row */
  onVideoAttached?: (videoUrl: string) => void;
  /** Suppress breadcrumbs and page chrome when embedded in a panel */
  embedded?: boolean;
}

export default function VideoManagerPage({ initialVideos, onVideoAttached, embedded = false }: Props = {}) {
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);
  const [videos, setVideos] = useState<VideoRecord[]>(initialVideos ?? []);
  const [loading, setLoading] = useState(!initialVideos);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchVideos();
  }, []);

  async function fetchVideos() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/videos/upload');
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos ?? data ?? []);
      }
    } catch {
      // API may return empty
    } finally {
      setLoading(false);
    }
  }

  const handleUploadComplete = (url: string) => {
    setUploadedVideos((prev) => [url, ...prev]);
    fetchVideos();
  };

  const copyToClipboard = (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const allVideos = [
    ...uploadedVideos.map((url, i) => ({
      id: `new-${i}`,
      title: url.split('/').pop() || 'Uploaded',
      url,
      created_at: new Date().toISOString(),
      duration_minutes: null,
    })),
    ...videos,
  ];

  const filtered = allVideos.filter(
    (v) =>
      (v.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.url || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className={embedded ? 'bg-white' : 'min-h-screen bg-white p-6'}>
      <div className={embedded ? '' : 'max-w-7xl mx-auto'}>
        {!embedded && (
          <>
            <div className="mb-4">
              <Breadcrumbs
                items={[
                  { label: 'Admin', href: '/admin/dashboard' },
                  { label: 'Videos', href: '/admin/videos' },
                  { label: 'Video Manager' },
                ]}
              />
            </div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Video Manager</h1>
                <p className="text-sm text-slate-700 mt-1">
                  Upload, manage, and organize lesson videos
                </p>
              </div>
              <button
                onClick={fetchVideos}
                className="p-2 text-slate-700 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </>
        )}
        {embedded && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">{filtered.length} video{filtered.length !== 1 ? 's' : ''} available</p>
            <button
              onClick={fetchVideos}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-700" /> Upload Video
          </h2>
          <VideoUploader onUploadComplete={handleUploadComplete} />
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
            <input
              type="text"
              placeholder="Search videos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Video List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">{filtered.length} Videos</h2>
          </div>
          {loading ? (
            <div className="px-6 py-12 text-center">
              <RefreshCw className="w-6 h-6 text-slate-700 mx-auto mb-2 animate-spin" />
              <p className="text-sm text-slate-700">Loading videos...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Video className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-700">
                {search ? 'No matching videos.' : 'No videos uploaded yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((v) => (
                <div
                  key={v.id}
                  className="px-6 py-3 flex items-center justify-between hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Video className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {v.title || v.url.split('/').pop()}
                      </div>
                      <div className="text-xs text-slate-700 truncate">{v.url}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {v.duration_minutes && (
                      <span className="text-xs text-slate-700">{v.duration_minutes}m</span>
                    )}
                    <span className="text-xs text-slate-700">
                      {new Date(v.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => copyToClipboard(v.url)}
                      className="p-1.5 text-slate-700 hover:text-slate-700 rounded"
                      title="Copy URL"
                    >
                      {copiedUrl === v.url ? (
                        <Check className="w-3.5 h-3.5 text-brand-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {onVideoAttached && (
                      <button
                        onClick={() => onVideoAttached(v.url)}
                        className="px-2 py-1 text-xs font-medium rounded bg-brand-blue-50 text-brand-blue-700 hover:bg-brand-blue-100 transition"
                        title="Attach to lesson"
                      >
                        Attach
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
