'use client';

/**
 * HeroVideo — shared premium hero video component.
 *
 * Rules (non-negotiable):
 * - No gradient overlays on the video frame.
 * - No headline, subheadline, paragraph, or CTA on top of the video.
 * - Only allowed on-video elements: brand bug, sound control, micro-label (2–4 words max).
 * - All primary messaging renders in the below-hero content slot.
 * - Transcript renders below the fold, never over the video.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import CanonicalVideo from '@/components/video/CanonicalVideo';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface HeroVideoCta {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

export interface HeroVideoProps {
  /** Desktop video source */
  videoSrcDesktop: string;
  /** Mobile video source — falls back to desktop if omitted */
  videoSrcMobile?: string;
  /** Poster image shown while video loads — optional */
  posterImage?: string;
  /** Voiceover audio track — starts on first user interaction */
  voiceoverSrc?: string;
  /** 2–4 word micro-label rendered in bottom-left corner of video */
  microLabel?: string;
  /** Show small brand bug in top-left corner */
  showBrandBug?: boolean;
  /** Below-hero headline */
  belowHeroHeadline?: string;
  /** Below-hero supporting line */
  belowHeroSubheadline?: string;
  /** CTA buttons rendered below the hero */
  ctas?: HeroVideoCta[];
  /** Optional trust indicator row below CTAs */
  trustIndicators?: string[];
  /** Voiceover transcript — rendered in expandable section below the fold */
  transcript?: string;
  /** Analytics name for tracking */
  analyticsName?: string;
  /** Additional className for the outer wrapper */
  className?: string;
  /** Render below-hero content as children instead of structured props */
  children?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function HeroVideo({
  videoSrcDesktop,
  videoSrcMobile,
  posterImage,
  voiceoverSrc,
  microLabel,
  showBrandBug = false,
  belowHeroHeadline,
  belowHeroSubheadline,
  ctas,
  trustIndicators,
  transcript,
  analyticsName,
  className = '',
  children,
}: HeroVideoProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const transcriptId = useId();
  const [videoSrc, setVideoSrc] = useState(videoSrcDesktop);
  const [ttsSupported, setTtsSupported] = useState(false);

  const ttsText = useMemo(() => {
    const fallback = [belowHeroHeadline, belowHeroSubheadline].filter(Boolean).join(' ');
    return (transcript || fallback).trim();
  }, [belowHeroHeadline, belowHeroSubheadline, transcript]);

  const hasVoiceNarration = Boolean(voiceoverSrc) || (ttsSupported && ttsText.length > 0);

  const startTtsNarration = useCallback(() => {
    if (!ttsSupported || !ttsText || typeof window === 'undefined' || !window.speechSynthesis) {
      return false;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(ttsText);
    utterance.rate = 0.98;
    utterance.pitch = 1;
    utterance.onend = () => setMuted(true);
    utterance.onerror = () => setMuted(true);
    window.speechSynthesis.speak(utterance);
    setMuted(false);
    return true;
  }, [ttsSupported, ttsText]);

  // Resolve a mobile-optimized source on mount. This can trigger one src swap
  // on small screens, but improves startup time versus always loading desktop
  // video on mobile.
  useEffect(() => {
    if (!videoSrcMobile) return;
    if (window.innerWidth < 768) {
      setVideoSrc(videoSrcMobile);
    }
  }, [videoSrcMobile]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('speechSynthesis' in window) {
      setTtsSupported(true);
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Start voiceover on first user interaction (browser autoplay policy)
  useEffect(() => {
    if (!hasVoiceNarration) return;

    const tryPlay = () => {
      if (!voiceoverSrc) {
        startTtsNarration();
        return;
      }

      const a = audioRef.current;
      if (!a) return;
      a.play()
        .then(() => setMuted(false))
        .catch(() => {
          startTtsNarration();
        });
    };

    window.addEventListener('click', tryPlay, { once: true });
    window.addEventListener('scroll', tryPlay, { once: true, passive: true });
    window.addEventListener('touchstart', tryPlay, { once: true, passive: true });

    return () => {
      window.removeEventListener('click', tryPlay);
      window.removeEventListener('scroll', tryPlay);
      window.removeEventListener('touchstart', tryPlay);
    };
  }, [hasVoiceNarration, startTtsNarration, voiceoverSrc]);

  function toggleMute() {
    if (!voiceoverSrc) {
      if (muted) {
        startTtsNarration();
      } else if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setMuted(true);
      }
      return;
    }

    const a = audioRef.current;
    if (!a) return;
    if (muted) {
      a.play()
        .then(() => setMuted(false))
        .catch(() => {
          startTtsNarration();
        });
    } else {
      a.pause();
      a.currentTime = 0;
      setMuted(true);
    }
  }

  return (
    <div ref={wrapperRef} className={`w-full ${className}`}>
      {/* VIDEO FRAME */}
      {/* Height: 56vw clamped between 400px and 780px */}
      {/* posterImage is set as CSS backgroundImage so the poster renders from
          SSR immediately — no bg-slate-900 dark flash before client hydration.
          CanonicalVideo then renders its own poster <img> (z:1) and video (z:2)
          on top. Both show the same image so the transition is seamless. */}
      <section
        className="relative w-full overflow-hidden"
        style={{
          height: 'clamp(400px, 56vw, 780px)',
          backgroundColor: '#0f172a',
        }}
        aria-label={analyticsName ? `${analyticsName} hero video` : 'Hero video'}
      >
        {/* autoPlayOnMount — hero is always above the fold; start immediately.
            loop — prevents the poster fading back in when the video ends. */}
        <CanonicalVideo
          src={videoSrc}
          poster={posterImage}
          className="absolute inset-0 w-full h-full object-cover object-center"
          autoPlayOnMount
          loop
          preloadFull
        />

        {/* Hidden audio element for voiceover */}
        {voiceoverSrc && (
          <audio
            ref={audioRef}
            src={voiceoverSrc}
            preload="none"
            aria-hidden="true"
            className="hidden"
          />
        )}

        {/* ON-VIDEO ELEMENTS (only these three are allowed) */}

        {/* Brand bug — top-left, only when requested */}
        {showBrandBug && (
          <div className="absolute top-4 left-4 z-10">
            <img
              src="/images/Elevate_for_Humanity_logo_81bf0fab.jpg"
              alt="Elevate for Humanity"
              className="h-7 w-auto opacity-90"
            />
          </div>
        )}

        {/* Micro-label — bottom-left, 2–4 words max */}
        {microLabel && (
          <div className="absolute bottom-4 left-4 z-10">
            <span className="text-white text-xs font-semibold tracking-widest uppercase">
              {microLabel}
            </span>
          </div>
        )}

        {/* Sound toggle — bottom-right, shown when narration is available */}
        {hasVoiceNarration && (
          <div className="absolute bottom-4 right-4 z-10">
            <button
              onClick={toggleMute}
              aria-label={muted ? 'Unmute narration' : 'Mute narration'}
              className="flex items-center gap-2 text-white/70 hover:text-white text-xs font-semibold px-2 py-1.5 rounded-full transition-colors"
            >
              {muted ? (
                <>
                  <VolumeX className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Tap to hear</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 flex-shrink-0 text-brand-red-400" />
                  <span className="hidden sm:inline">Mute</span>
                </>
              )}
            </button>
          </div>
        )}
      </section>

      {/* BELOW-HERO CONTENT */}
      {/* All primary messaging lives here — never on the video */}
      {(belowHeroHeadline || belowHeroSubheadline || ctas || trustIndicators || children) && (
        <section className="border-b border-slate-100 py-10 sm:py-14">
          <div className="max-w-4xl mx-auto px-6">
            {children ? (
              children
            ) : (
              <>
                {belowHeroHeadline && (
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
                    {belowHeroHeadline}
                  </h1>
                )}
                {belowHeroSubheadline && (
                  <p className="text-slate-900 text-lg leading-relaxed mb-8 max-w-2xl">
                    {belowHeroSubheadline}
                  </p>
                )}
                {ctas && ctas.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-6">
                    {ctas.map((cta) => (
                      <a
                        key={cta.href}
                        href={cta.href}
                        className={
                          cta.variant === 'secondary'
                            ? 'border border-slate-300 text-slate-700 font-bold px-7 py-3 rounded-lg hover:bg-slate-50 transition-colors text-sm'
                            : 'bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3 rounded-lg transition-colors text-sm'
                        }
                      >
                        {cta.label}
                      </a>
                    ))}
                  </div>
                )}
                {trustIndicators && trustIndicators.length > 0 && (
                  <ul className="flex flex-wrap gap-x-6 gap-y-1.5 mt-2">
                    {trustIndicators.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-1.5 text-slate-900 text-sm font-medium"
                      >
                        <span className="w-1 h-1 rounded-full bg-brand-red-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* TRANSCRIPT */}
      {/* Expandable, below the fold — never over the video */}
      {transcript && (
        <div className="bg-slate-50 border-b border-slate-100">
          <div className="max-w-4xl mx-auto px-6 py-3">
            <button
              onClick={() => setTranscriptOpen((o) => !o)}
              aria-expanded={transcriptOpen}
              aria-controls={transcriptId}
              className="flex items-center gap-2 text-slate-500 text-xs font-semibold hover:text-slate-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-red-500 rounded"
            >
              <span>{transcriptOpen ? '▲' : '▼'}</span>
              Video transcript
            </button>
            {transcriptOpen && (
              <p
                id={transcriptId}
                className="mt-3 text-slate-800 text-sm leading-relaxed max-w-2xl"
              >
                {transcript}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
