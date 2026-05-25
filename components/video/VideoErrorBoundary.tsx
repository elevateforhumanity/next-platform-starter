'use client';

import { Component, type ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  /** Optional poster image to show when video fails */
  fallbackPoster?: string;
  /** Alt text for the fallback poster */
  fallbackAlt?: string;
  className?: string;
}

interface State {
  hasError: boolean;
}

/**
 * VideoErrorBoundary — catches render-time errors in video subtrees.
 *
 * For runtime video load errors (404, codec failure) the CanonicalVideo
 * component already handles those via its own onError handler. This boundary
 * covers the rarer case where the React component tree itself throws.
 */
export default class VideoErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    logger.error('[VideoErrorBoundary] Video component error:', error.message);
  }

  render() {
    if (this.state.hasError) {
      const { fallbackPoster, fallbackAlt = 'Hero image', className } = this.props;
      if (fallbackPoster) {
        return (
          // IMAGE-CONTRACT: allow raw img because legacy markup
          <img
            src={fallbackPoster}
            alt={fallbackAlt}
            className={className ?? 'absolute inset-0 w-full h-full object-cover'}
            style={{ objectFit: 'cover' }}
          />
        );
      }
      return (
        <div
          className={className ?? 'absolute inset-0 w-full h-full'}
          style={{ background: '#0f172a' }}
          aria-hidden="true"
        >
          <span className="sr-only">Video content is temporarily unavailable.</span>
        </div>
      );
    }

    return this.props.children;
  }
}
