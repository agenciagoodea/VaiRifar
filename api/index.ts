import { createApp } from './app.js';

const appPromise = createApp({ includeFrontend: false });

function normalizePath(pathParam: unknown) {
  if (Array.isArray(pathParam)) return pathParam.join('/');
  return typeof pathParam === 'string' ? pathParam : '';
}

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  const path = normalizePath(req.query?.path);

  if (path) {
    const searchParams = new URLSearchParams(req.query || {});
    searchParams.delete('path');
    const query = searchParams.toString();
    req.url = `/api/${path}${query ? `?${query}` : ''}`;
  } else if (typeof req.url === 'string' && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }

  return app(req, res);
}
