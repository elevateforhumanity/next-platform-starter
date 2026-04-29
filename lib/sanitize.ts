// Uses sanitize-html (htmlparser2-based) — no jsdom dependency, safe in serverless/Lambda.
// isomorphic-dompurify was removed because it requires jsdom at runtime which is not
// available in Netlify Lambda functions.
import sanitizeHtmlLib from 'sanitize-html';

const RICH_TAGS = [
  'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'a', 'img', 'video', 'audio', 'source',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'blockquote', 'pre', 'code', 'span', 'div',
  'figure', 'figcaption', 'hr', 'sub', 'sup',
];

const RICH_ATTRS: sanitizeHtmlLib.IOptions['allowedAttributes'] = {
  '*': ['class', 'id', 'style', 'title'],
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height'],
  video: ['src', 'controls', 'autoplay', 'loop', 'muted', 'poster', 'preload', 'width', 'height'],
  audio: ['src', 'controls', 'autoplay', 'loop', 'muted', 'preload'],
  source: ['src', 'type'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan'],
};

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  return sanitizeHtmlLib(dirty, {
    allowedTags: RICH_TAGS,
    allowedAttributes: RICH_ATTRS,
    disallowedTagsMode: 'discard',
  });
}

// Strict sanitization for user-generated content (comments, messages)
export function sanitizeUserContent(dirty: string): string {
  if (!dirty) return '';
  return sanitizeHtmlLib(dirty, {
    allowedTags: ['p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'code'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
  });
}

// Plain text only — strips all HTML
export function sanitizeToText(dirty: string): string {
  if (!dirty) return '';
  return sanitizeHtmlLib(dirty, { allowedTags: [], allowedAttributes: {} });
}
