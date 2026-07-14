import { NextFunction, Request, Response } from 'express';
import { inHTMLData } from 'xss-filters';

// Fields that intentionally contain trusted HTML (admin-only, RBAC-protected routes).
// These are excluded from XSS encoding so rich-text content is stored and served correctly.
const HTML_PASSTHROUGH_KEYS = new Set([
  'contentHtml',
  'contentJson',
  'content_html',
  'content_json',
]);

function cleanValue(value: unknown, key?: string): unknown {
  if (key && HTML_PASSTHROUGH_KEYS.has(key)) return value;

  if (typeof value === 'string') {
    return inHTMLData(value).trim();
  }

  if (Array.isArray(value)) {
    return value.map(item => cleanValue(item));
  }

  if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      cleaned[k] = cleanValue(v, k);
    }
    return cleaned;
  }

  return value;
}

export const clean = <T>(data: T | string = ''): T => {
  return cleanValue(data) as T;
};

const middleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body) req.body = cleanValue(req.body);
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        req.query[key] = cleanValue(req.query[key], key) as (typeof req.query)[string];
      });
    }
    if (req.params) {
      Object.keys(req.params).forEach(key => {
        req.params[key] = cleanValue(req.params[key], key) as string;
      });
    }
    next();
  };
};

export default middleware;
