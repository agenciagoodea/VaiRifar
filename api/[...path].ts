import { createApp } from './app.js';

const appPromise = createApp({ includeFrontend: false });

export default async function handler(req: any, res: any) {
  const app = await appPromise;

  if (typeof req.url === 'string' && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }

  return app(req, res);
}
