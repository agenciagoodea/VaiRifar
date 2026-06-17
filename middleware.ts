export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  const isBot = /facebookexternalhit|twitterbot|whatsapp|telegrambot|slackbot|googlebot|bingbot|linkedinbot|yandex|baidu|pinterest|skypeuripreview|opengraph|vkshare|w3c_validator/i.test(userAgent);

  if (isBot && url.pathname === '/') {
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
