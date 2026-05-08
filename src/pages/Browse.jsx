import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import './Browse.css';

const GENRES = [
  { id: 1, name: 'Action' },
  { id: 2, name: 'Adventure' },
  { id: 4, name: 'Comedy' },
  { id: 8, name: 'Drama' },
  { id: 10, name: 'Fantasy' },
  { id: 22, name: 'Romance' },
  { id: 24, name: 'Sci-Fi' },
  { id: 41, name: 'Suspense' },
  { id: 30, name: 'Sports' },
  { id: 62, name: 'Isekai' },
  { id: 36, name: 'Slice of Life' },
  { id: 7, name: 'Mystery' },
  { id: 37, name: 'Supernatural' },
  { id: 13, name: 'Historical' },
  { id: 18, name: 'Mecha' },
  { id: 40, name: 'Psychological' }
];

export default function Browse() {
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Router URL Search Parameters
  const [searchParams, setSearchParams] = useSearchParams();
  const letterParam = searchParams.get('letter') || '';

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLetter, setSelectedLetter] = useState(letterParam);

  // Pagination States
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Sync state with URL parameter changes
  useEffect(() => {
    setSelectedLetter(letterParam);
    if (letterParam) {
      setSearch(''); // Clear search query to avoid conflicts
    }
  }, [letterParam]);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, selectedGenre, selectedType, selectedStatus, selectedLetter]);

  useEffect(() => {
    const fetchBrowseData = async () => {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      try {
        // Build base search URL
        let url = `https://api.jikan.moe/v4/anime?order_by=popularity&sort=asc&limit=24&page=${page}`;
        
        if (search.trim()) {
          url += `&q=${encodeURIComponent(search.trim())}`;
        }
        if (selectedGenre) {
          url += `&genres=${selectedGenre}`;
        }
        if (selectedType) {
          url += `&type=${selectedType}`;
        }
        if (selectedStatus) {
          url += `&status=${selectedStatus}`;
        }
        
        // Jikan supports alphabetical starts-with search on [A-Z] via 'letter' parameter
        if (selectedLetter && /^[a-zA-Z]$/.test(selectedLetter)) {
          url += `&letter=${selectedLetter}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        
        if (data.data) {
          const mapped = data.data.map((item) => ({
            id: `mal-${item.mal_id}`,
            title: item.title,
            poster: item.images?.jpg?.large_image_url,
            score: item.score,
            status: item.status,
            year: item.year,
            type: [item.type]
          }));
          
          if (page === 1) {
            setAnimes(mapped);
          } else {
            setAnimes((prev) => [...prev, ...mapped]);
          }
          setHasMore(data.pagination?.has_next_page || false);
        } else {
          if (page === 1) setAnimes([]);
          setHasMore(false);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch filtered anime list.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    const debounce = setTimeout(fetchBrowseData, 500);
    return () => clearTimeout(debounce);
  }, [search, selectedGenre, selectedType, selectedStatus, selectedLetter, page]);

  const handleClearLetter = () => {
    // Remove the letter param from URL
    const updatedParams = new URLSearchParams(searchParams);
    updatedParams.delete('letter');
    setSearchParams(updatedParams);
    setSelectedLetter('');
  };

  return (
    <div className="browse-page container">
      <h1 className="page-title text-gradient mt-8">Explore Anime</h1>
      <p className="page-subtitle text-muted mb-8">Filter by genre, format, or search for any anime from the global catalog.</p>

      <div className="filters-container glass-panel p-6 mb-8">
        <div className="filters-grid">
          {/* Search bar */}
          <div className="filter-item">
            <label className="filter-label">Search</label>
            <input 
              type="text" 
              placeholder={selectedLetter ? "Clear letter filter first..." : "Search title..."}
              value={search} 
              disabled={!!selectedLetter}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-input"
            />
          </div>

          {/* Genre Select */}
          <div className="filter-item">
            <label className="filter-label">Genre</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="filter-select"
            >
              <option value="">All Genres</option>
              {GENRES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Select */}
          <div className="filter-item">
            <label className="filter-label">Format</label>
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
              className="filter-select"
            >
              <option value="">All Formats</option>
              <option value="tv">TV Shows</option>
              <option value="movie">Movies</option>
              <option value="special">Specials</option>
              <option value="ova">OVA</option>
            </select>
          </div>

          {/* Status Select */}
          <div className="filter-item">
            <label className="filter-label">Status</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="airing">Currently Airing</option>
              <option value="complete">Completed</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selected Letter Indicator Badge */}
      {selectedLetter && (
        <div 
          className="active-letter-filter flex items-center gap-3 mb-6 p-3 glass-panel" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            borderRadius: '0.5rem', 
            border: '1px solid var(--primary)',
            background: 'rgba(139, 92, 246, 0.08)',
            gap: '0.75rem'
          }}
        >
          <span className="text-muted text-sm" style={{ fontSize: '0.875rem' }}>Active Alphabet:</span>
          <span 
            className="font-bold text-accent" 
            style={{ 
              color: 'var(--accent)', 
              fontWeight: 800, 
              fontSize: '1.2rem',
              textShadow: '0 0 10px rgba(244, 63, 94, 0.3)'
            }}
          >
            {selectedLetter === 'hash' ? '#' : selectedLetter === 'num' ? '0-9' : selectedLetter.toUpperCase()}
          </span>
          <button 
            onClick={handleClearLetter} 
            className="btn-clear-letter text-muted hover-white" 
            style={{ 
              cursor: 'pointer', 
              background: 'rgba(255,255,255,0.1)', 
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '0.25rem 0.75rem', 
              borderRadius: '0.375rem', 
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text)',
              transition: 'all 0.2s'
            }}
          >
            ✕ Clear
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-state flex justify-center items-center py-12">Loading...</div>
      ) : error ? (
        <div className="error-state text-accent py-12 text-center">{error}</div>
      ) : animes.length > 0 ? (
        <>
          <div className="anime-grid">
            {animes.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>

          {hasMore && (
            <div className="load-more-container">
              <button 
                onClick={() => setPage((prev) => prev + 1)}
                disabled={loadingMore}
                className="btn-load-more"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state text-muted py-12 text-center">No results match your criteria.</div>
      )}
    </div>
  );
}
