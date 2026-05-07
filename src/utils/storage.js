const WATCHLIST_KEY = 'anistreamz_watchlist';
const HISTORY_KEY = 'anistreamz_history';

export function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || [];
  } catch {
    return [];
  }
}

export function addToWatchlist(anime) {
  const list = getWatchlist();
  if (!list.some(item => item.id === anime.id)) {
    list.push({
      id: anime.id,
      title: anime.title,
      poster: anime.poster || anime.background_image,
      score: anime.score,
      status: anime.status
    });
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
  }
}

export function removeFromWatchlist(animeId) {
  const list = getWatchlist();
  const filtered = list.filter(item => item.id !== animeId);
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(filtered));
}

export function isInWatchlist(animeId) {
  return getWatchlist().some(item => item.id === animeId);
}

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveToHistory(anime, episode) {
  let history = getHistory();
  // Remove existing entry for this anime so we can move it to the front
  history = history.filter(item => item.animeId !== anime.id);
  
  history.unshift({
    animeId: anime.id,
    animeTitle: anime.title,
    animePoster: anime.poster || anime.background_image,
    episodeNumber: episode.number,
    episodeEmbedId: episode.episode_embed_id,
    watchedAt: Date.now()
  });

  // Limit history to top 20 items
  if (history.length > 20) {
    history = history.slice(0, 20);
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function removeFromHistory(animeId) {
  const history = getHistory();
  const filtered = history.filter(item => item.animeId !== animeId);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
}
