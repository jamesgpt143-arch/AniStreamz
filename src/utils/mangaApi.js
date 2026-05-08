const isDev = import.meta.env.DEV;

/**
 * Custom fetch wrapper for MangaDex API requests.
 * Uses local Vite proxy in development for speed and direct connection,
 * and routes through a free CORS proxy (allorigins) in production to bypass Vercel serverless IP bans.
 * 
 * @param {string} endpoint - The target MangaDex API path (e.g. "/manga" or "chapter/123")
 * @param {RequestInit} [options] - Additional fetch configurations
 * @returns {Promise<Response>}
 */
export async function fetchMangaDex(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  if (isDev) {
    return fetch(`/mangadex/${cleanEndpoint}`, options);
  } else {
    const targetUrl = `https://api.mangadex.org/${cleanEndpoint}`;
    const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    return fetch(proxiedUrl, options);
  }
}
