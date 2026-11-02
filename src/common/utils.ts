import slugify from 'slugify';
import sanitizeHtml from 'sanitize-html';

export function makeSlug(input: string): string {
  return slugify(input || '', { lower: true, strict: true }).slice(0, 120) || `item-${Date.now()}`;
}

export function cleanHtml(dirty = ''): string {
  return sanitizeHtml(dirty, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'iframe']),
    allowedAttributes: { '*': ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel', 'width', 'height', 'allowfullscreen', 'frameborder'] },
  });
}

export function jobApplicationStatus(job: { status: string; applyStart?: any; applyDeadline?: any }): string {
  if (job.status !== 'published') return 'Unpublished';
  const now = new Date();
  if (job.applyStart && new Date(job.applyStart) > now) return 'Upcoming';
  if (job.applyDeadline && new Date(job.applyDeadline) < now) return 'Closed';
  return 'Running';
}

export function isValidUrl(u?: string): boolean {
  if (!u) return true;
  try { const x = new URL(u); return ['http:', 'https:'].includes(x.protocol); } catch { return false; }
}
