'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, Send, ThumbsUp, Clock, User } from 'lucide-react';

interface Post {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  tags: string[];
  author_name: string;
  author_avatar: string | null;
}

interface Props {
  /** Slug used as the tag filter, e.g. "healthcare", "trades", "career" */
  groupSlug: string;
  /** Accent colour class for the post button, e.g. "bg-brand-red-600 hover:bg-brand-red-700" */
  accentClass?: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function GroupDiscussions({
  groupSlug,
  accentClass = 'bg-brand-blue-600 hover:bg-brand-blue-700',
}: Props) {
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [submitting, startSubmit] = useTransition();
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [supabase]);

  async function fetchPosts() {
    setLoading(true);
    const { data } = await supabase
      .from('community_posts')
      .select(
        `
        id, content, created_at, likes_count, tags,
        profiles:user_id ( full_name, avatar_url )
      `,
      )
      .contains('tags', [groupSlug])
      .order('created_at', { ascending: false })
      .limit(50);

    setPosts(
      (data ?? []).map((p: any) => ({
        id: p.id,
        content: p.content,
        created_at: p.created_at,
        likes_count: p.likes_count ?? 0,
        tags: p.tags ?? [],
        author_name: p.profiles?.full_name ?? 'Member',
        author_avatar: p.profiles?.avatar_url ?? null,
      })),
    );
    setLoading(false);
  }

  useEffect(() => {
    fetchPosts();
  }, [groupSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit() {
    const content = draft.trim();
    if (!content || !userId) return;
    setError('');

    startSubmit(async () => {
      const { error: err } = await supabase
        .from('community_posts')
        .insert({ content, user_id: userId, tags: [groupSlug] });

      if (err) {
        setError('Failed to post. Please try again.');
        return;
      }
      setDraft('');
      await fetchPosts();
    });
  }

  async function handleLike(postId: string, current: number) {
    await supabase
      .from('community_posts')
      .update({ likes_count: current + 1 })
      .eq('id', postId);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p)),
    );
  }

  return (
    <div className="space-y-4">
      {/* Composer */}
      {userId && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
            placeholder="Share something with the group…"
            rows={3}
            className="w-full resize-none text-sm text-slate-900 placeholder-slate-400 border-0 outline-none focus:ring-0 bg-transparent"
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-400">Ctrl+Enter to post</span>
            <button
              onClick={handleSubmit}
              disabled={!draft.trim() || submitting}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-sm font-medium transition disabled:opacity-40 ${accentClass}`}
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-1/4" />
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-medium text-slate-700">No posts yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Be the first to start a discussion in this group.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {post.author_avatar ? (
                    // IMAGE-CONTRACT: allow raw img because author_avatar is a user-supplied external URL incompatible with next/image domain config
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.author_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-900">{post.author_name}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {timeAgo(post.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                    {post.content}
                  </p>
                  <button
                    onClick={() => handleLike(post.id, post.likes_count)}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-brand-blue-600 transition"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {post.likes_count > 0 && <span>{post.likes_count}</span>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
