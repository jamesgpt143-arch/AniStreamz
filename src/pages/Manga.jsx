import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { BookOpen, Star, AlertCircle, Loader2 } from 'lucide-react';
import MangaCard from '../components/MangaCard';
import './Manga.css';

const FEATURED_POOL = [
  '32d76d19-8a05-4db0-9fc2-e0b0648fe9d0', // Solo Leveling
  'a1c09fc3-8472-4d2a-899c-e67c9c0b1156', // One Piece
  '61da8785-021c-4b57-ad6b-80dfa2123961', // Frieren
  'a77742b1-efb6-4f40-8fbe-bc31ef755a94'  // Chainsaw Man
];

export default function Manga() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');

  const [featured, setFeatured] = useState(null);
  const [trending, setTrending] = useState([]);
  const [latest, setLatest] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to extract cover URL from Manga relationship array
  const getCoverUrl = (mangaId, relationships, quality = '') => {
    const cover = relationships?.find(r => r.type === 'cover_art');
    const fileName = cover?.attributes?.fileName;
    if (!fileName) return 'https://via.placeholder.com/300x450?text=No+Cover';
    const suffix = quality ? `.${quality}.jpg` : '';
    return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}${suffix}`;
  };

  // Helper to extract author name
  const getAuthorName = (relationships) => {
    const author = relationships?.find(r => r.type === 'author');
    return author?.attributes?.name || 'Unknown Author';
  };

  useEffect(() => {
    // If we have a query, fetch search results
    if (searchQuery) {
      const fetchSearch = async () => {
        setSearchLoading(true);
        setError(null);
        try {
          const res = await fetch(
            `https://api.mangadex.org/manga?limit=24&title=${encodeURIComponent(
              searchQuery
            )}&includes[]=cover_art&includes[]=author&contentRating[]=safe&contentRating[]=suggestive`
          );
          const data = await res.json();
          
          const results = (data.data || []).map(m => ({
            id: m.id,
            title: m.attributes?.title?.en || Object.values(m.attributes?.title || {})[0] || 'Unknown Title',
            poster: getCoverUrl(m.id, m.relationships, '512'),
            author: getAuthorName(m.relationships),
            rating: m.attributes?.status === 'ongoing' ? 'Ongoing' : 'Completed',
            status: m.attributes?.status || 'N/A'
          }));
          
          setSearchResults(results);
        } catch (err) {
          console.error(err);
          setError('Failed to fetch manga search results. Please try again.');
        } finally {
          setSearchLoading(false);
        }
      };
      fetchSearch();
    } else {
      // Fetch Home Data (Featured, Trending, Latest)
      const fetchHomeData = async () => {
        setLoading(true);
        setError(null);
        try {
          // Select random featured ID from pool
          const randomId = FEATURED_POOL[Math.floor(Math.random() * FEATURED_POOL.length)];

          // 1. Fetch Featured Manga Info
          const featPromise = fetch(
            `https://api.mangadex.org/manga/${randomId}?includes[]=cover_art&includes[]=author`
          ).then(r => r.json());

          // 2. Fetch Trending Manga (popular by followedCount)
          const trendPromise = fetch(
            'https://api.mangadex.org/manga?limit=12&includes[]=cover_art&includes[]=author&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive'
          ).then(r => r.json());

          // 3. Fetch Latest Manga (recent chapter updates)
          const latestPromise = fetch(
            'https://api.mangadex.org/manga?limit=12&includes[]=cover_art&includes[]=author&order[latestUploadedChapter]=desc&contentRating[]=safe&contentRating[]=suggestive'
          ).then(r => r.json());

          const [featRes, trendRes, latestRes] = await Promise.all([
            featPromise,
            trendPromise,
            latestPromise
          ]);

          // Set Featured
          if (featRes.data) {
            const m = featRes.data;
            setFeatured({
              id: m.id,
              title: m.attributes?.title?.en || Object.values(m.attributes?.title || {})[0] || 'Featured Manga',
              description: m.attributes?.description?.en?.split('\n')[0] || 'No description available.',
              poster: getCoverUrl(m.id, m.relationships),
              author: getAuthorName(m.relationships),
              status: m.attributes?.status || 'ongoing',
              demographic: m.attributes?.publicationDemographic || 'General'
            });
          }

          // Set Trending
          const trendingList = (trendRes.data || []).map(m => ({
            id: m.id,
            title: m.attributes?.title?.en || Object.values(m.attributes?.title || {})[0] || 'Manga',
            poster: getCoverUrl(m.id, m.relationships, '512'),
            author: getAuthorName(m.relationships),
            status: m.attributes?.status,
            rating: m.attributes?.state === 'published' ? '★ Popular' : null
          }));
          setTrending(trendingList);

          // Set Latest Updates
          const latestList = (latestRes.data || []).map(m => ({
            id: m.id,
            title: m.attributes?.title?.en || Object.values(m.attributes?.title || {})[0] || 'Manga',
            poster: getCoverUrl(m.id, m.relationships, '512'),
            author: getAuthorName(m.relationships),
            status: m.attributes?.status,
            rating: 'New'
          }));
          setLatest(latestList);

        } catch (err) {
          console.error(err);
          setError('Failed to fetch MangaDex content. Please check your connection.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchHomeData();
    }
  }, [searchQuery]);

  // Display Search Results Screen
  if (searchQuery) {
    return (
      <div className="container py-8 min-h-screen manga-page animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="section-title">
            Search Results for: <span className="text-accent">"{searchQuery}"</span>
          </h2>
          <Link to="/manga" className="back-link flex items-center gap-2">
            ← Back to Home
          </Link>
        </div>

        {searchLoading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-3">
            <Loader2 className="spinner text-primary" size={40} />
            <p className="text-muted">Searching MangaDex network...</p>
          </div>
        ) : error ? (
          <div className="error-panel flex items-center gap-3">
            <AlertCircle className="text-red-500" />
            <span>{error}</span>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="anime-grid">
            {searchResults.map((manga) => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
          </div>
        ) : (
          <div className="empty-panel text-center py-16">
            <AlertCircle size={48} className="mx-auto mb-4 text-muted" />
            <p className="text-xl font-bold">No Manga Found</p>
            <p className="text-muted mt-2">Try checking the spelling or search for another title.</p>
          </div>
        )}
      </div>
    );
  }

  // Display Home Screen Loading
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <Loader2 className="spinner text-primary animate-spin" size={48} />
        <p className="text-muted text-lg">Initializing Premium Manga Explorer...</p>
      </div>
    );
  }

  return (
    <div className="manga-home pb-16 min-h-screen manga-page">
      {/* Featured Hero Banner */}
      {featured && (
        <div className="manga-hero relative overflow-hidden flex items-center">
          <div 
            className="hero-blur-bg" 
            style={{ backgroundImage: `url(${featured.poster})` }}
          />
          <div className="hero-overlay" />
          
          <div className="container hero-content flex flex-col md:flex-row items-center gap-8 relative z-10 py-12 md:py-20">
            <div className="hero-poster-box">
              <img src={featured.poster} alt={featured.title} className="hero-poster" />
            </div>
            <div className="hero-text flex flex-col items-center md:items-start text-center md:text-left flex-1">
              <div className="hero-meta flex items-center gap-3 mb-3">
                <span className="hero-badge badge-primary uppercase">{featured.status}</span>
                <span className="hero-badge badge-secondary uppercase">{featured.demographic}</span>
              </div>
              <h1 className="hero-title font-extrabold text-white leading-tight mb-4">
                {featured.title}
              </h1>
              <p className="hero-author text-muted text-lg mb-4">
                By: <span className="text-accent font-semibold">{featured.author}</span>
              </p>
              <p className="hero-desc text-muted mb-6 line-clamp-3">
                {featured.description}
              </p>
              <Link to={`/manga/${featured.id}`} className="hero-btn flex items-center gap-2">
                <BookOpen size={20} />
                <span>Read Now</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="container py-8 flex flex-col gap-10">
        {error && (
          <div className="error-panel flex items-center gap-3">
            <AlertCircle className="text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Trending Section */}
        {trending.length > 0 && (
          <section className="manga-section">
            <div className="flex items-center gap-2 mb-6">
              <div className="section-dot bg-primary" />
              <h2 className="section-title m-0">Trending Manga</h2>
            </div>
            <div className="anime-grid">
              {trending.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          </section>
        )}

        {/* Latest Updates Section */}
        {latest.length > 0 && (
          <section className="manga-section">
            <div className="flex items-center gap-2 mb-6">
              <div className="section-dot bg-accent" />
              <h2 className="section-title m-0">Latest Chapters</h2>
            </div>
            <div className="anime-grid">
              {latest.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
