export default async function middleware(request: Request) {
  const url = new URL(request.url);

  if (url.pathname === '/') {
    const apiUrl = new URL('/api/', request.url);
    try {
      const response = await fetch(apiUrl, {
        headers: request.headers
      });
      return response;
    } catch (e) {
      console.error('Erro no middleware ao buscar API:', e);
    }
  }

  // Retorna undefined para continuar o fluxo normal (Vercel serve o estático da CDN)
  return;
}
