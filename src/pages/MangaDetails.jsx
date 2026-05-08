import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, BookOpen, Clock, Tag, ArrowUpDown, Search, Loader2, AlertCircle } from 'lucide-react';
import './MangaDetails.css';

export default function MangaDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Controls for sorting and searching chapters
  const [sortAsc, setSortAsc] = useState(true);
  const [chapterQuery, setChapterQuery] = useState('');

  // Helper to extract cover URL from Manga relationship array
  const getCoverUrl = (mangaId, relationships) => {
    const cover = relationships?.find(r => r.type === 'cover_art');
    const fileName = cover?.attributes?.fileName;
    if (!fileName) return 'https://via.placeholder.com/300x450?text=No+Cover';
    return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`;
  };

  // Helper to extract author name
  const getAuthorName = (relationships) => {
    const author = relationships?.find(r => r.type === 'author');
    return author?.attributes?.name || 'Unknown Author';
  };

  useEffect(() => {
    const fetchMangaDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch Manga Metadata
        const metaRes = await fetch(
          `https://api.mangadex.org/manga/${id}?includes[]=cover_art&includes[]=author`
        );
        const metaData = await metaRes.json();
        
        if (!metaData.data) {
          throw new Error('Manga not found on the MangaDex network.');
        }

        const m = metaData.data;
        const genresList = m.attributes?.tags
          ?.filter(t => t.attributes?.group === 'genre')
          ?.map(t => t.attributes?.name?.en) || [];

        const mangaMeta = {
          id: m.id,
          title: m.attributes?.title?.en || Object.values(m.attributes?.title || {})[0] || 'Unknown Manga',
          description: m.attributes?.description?.en || 'No synopsis available.',
          poster: getCoverUrl(m.id, m.relationships),
          author: getAuthorName(m.relationships),
          status: m.attributes?.status || 'N/A',
          demographic: m.attributes?.publicationDemographic || 'General',
          year: m.attributes?.year || 'N/A',
          genres: genresList,
          rating: m.attributes?.contentRating || 'safe'
        };

        setManga(mangaMeta);

        // 2. Fetch Chapters Feed (limit to 500 English chapters)
        const feedRes = await fetch(
          `https://api.mangadex.org/manga/${id}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=500&contentRating[]=safe&contentRating[]=suggestive`
        );
        const feedData = await feedRes.json();

        // 3. Precise Deduplication & Formatting of chapters
        const uniqueChapters = [];
        const seenChapterNumbers = new Set();
        
        // Sort chapters numerically to ensure sequential tracking
        const rawFeed = feedData.data || [];
        const sortedRaw = [...rawFeed].sort((a, b) => {
          const numA = parseFloat(a.attributes?.chapter) || 0;
          const numB = parseFloat(b.attributes?.chapter) || 0;
          return numA - numB;
        });

        sortedRaw.forEach(chap => {
          const chNum = chap.attributes?.chapter;
          // Deduplicate based on chapter number
          if (chNum && !seenChapterNumbers.has(chNum)) {
            seenChapterNumbers.add(chNum);
            
            // Format dates cleanly
            const readableDate = chap.attributes?.readableAt 
              ? new Date(chap.attributes.readableAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              : 'N/A';

            uniqueChapters.push({
              id: chap.id,
              number: chNum,
              title: chap.attributes?.title || `Chapter ${chNum}`,
              date: readableDate
            });
          }
        });

        setChapters(uniqueChapters);

      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to retrieve details from MangaDex.');
      } finally {
        setLoading(false);
      }
    };

    fetchMangaDetails();
  }, [id]);

  // Sort operations
  const sortedChapters = [...chapters].sort((a, b) => {
    const numA = parseFloat(a.number) || 0;
    const numB = parseFloat(b.number) || 0;
    return sortAsc ? numA - numB : numB - numA;
  });

  // Filter operations based on query input
  const filteredChapters = sortedChapters.filter(c => 
    c.number.includes(chapterQuery) || 
    c.title.toLowerCase().includes(chapterQuery.toLowerCase())
  );

  // Navigate directly to first chapter for quick start
  const handleQuickRead = () => {
    if (chapters.length > 0) {
      // The chapters state is already sorted ascending natively
      navigate(`/manga/read/${chapters[0].id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <Loader2 className="spinner text-primary animate-spin" size={48} />
        <p className="text-muted text-lg">Retrieving Manga details...</p>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="container py-16 min-h-screen flex flex-col justify-center items-center">
        <AlertCircle className="text-red-500 mb-4" size={54} />
        <h2 className="text-2xl font-bold mb-2">Details Retrieval Failed</h2>
        <p className="text-muted mb-6 text-center max-w-md">{error || 'Unable to connect to network nodes.'}</p>
        <Link to="/manga" className="hero-btn">
          Back to Manga Explorer
        </Link>
      </div>
    );
  }

  return (
    <div className="manga-details-page pb-16 min-h-screen">
      {/* Detail Header Banner */}
      <div className="details-banner relative overflow-hidden flex items-center">
        <div 
          className="banner-blur-bg" 
          style={{ backgroundImage: `url(${manga.poster})` }}
        />
        <div className="banner-overlay" />
        
        <div className="container banner-content flex flex-col md:flex-row items-center gap-8 relative z-10 py-12 md:py-16">
          <div className="banner-poster-box">
            <img src={manga.poster} alt={manga.title} className="banner-poster" />
          </div>
          <div className="banner-text flex-1 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="banner-badges flex items-center gap-3 mb-4">
              <span className="banner-badge badge-primary uppercase">{manga.status}</span>
              <span className="banner-badge badge-secondary uppercase">{manga.demographic}</span>
              <span className="banner-badge badge-accent uppercase">{manga.rating}</span>
            </div>
            
            <h1 className="banner-title font-extrabold text-white leading-tight mb-4">
              {manga.title}
            </h1>
            
            <div className="banner-metadata flex flex-wrap justify-center md:justify-start items-center gap-x-6 gap-y-2 text-muted mb-5 font-medium">
              <span className="flex items-center gap-1.5">
                <Clock size={16} />
                <span>Published: {manga.year}</span>
              </span>
              <span>•</span>
              <span>
                By: <strong className="text-accent">{manga.author}</strong>
              </span>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              {chapters.length > 0 ? (
                <button 
                  onClick={handleQuickRead}
                  className="banner-btn flex items-center justify-center gap-2 flex-1 md:flex-none"
                >
                  <BookOpen size={20} />
                  <span>Start Reading (Ch {chapters[0].number})</span>
                </button>
              ) : (
                <button disabled className="banner-btn disabled flex items-center justify-center gap-2 flex-1 md:flex-none">
                  <BookOpen size={20} />
                  <span>No chapters available</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left 2 Columns: Synopsis & Chapters List */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Synopsis */}
          <div className="details-box card-panel p-6">
            <h3 className="box-title mb-4">Synopsis</h3>
            <p className="synopsis-text text-muted leading-relaxed whitespace-pre-line">
              {manga.description}
            </p>
          </div>

          {/* Chapters Explorer */}
          <div className="details-box card-panel p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h3 className="box-title m-0 flex items-center gap-2">
                <span>Chapters</span>
                <span className="chapter-count">({chapters.length})</span>
              </h3>
              
              {/* Filter controls */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                {/* Search Bar inside chapter listing */}
                <div className="chapter-search flex items-center px-3 py-1.5 flex-1 md:flex-none">
                  <Search size={16} className="text-muted mr-2" />
                  <input 
                    type="text" 
                    placeholder="Search chapters..."
                    value={chapterQuery}
                    onChange={(e) => setChapterQuery(e.target.value)}
                    className="chapter-search-input"
                  />
                </div>
                {/* Sort Toggle */}
                <button 
                  onClick={() => setSortAsc(!sortAsc)} 
                  className="sort-btn flex items-center gap-1.5 px-3 py-1.5"
                  title="Toggle sorting order"
                >
                  <ArrowUpDown size={16} />
                  <span className="text-sm font-semibold">{sortAsc ? 'Asc' : 'Desc'}</span>
                </button>
              </div>
            </div>

            {/* Deduplicated Chapters Listing */}
            {filteredChapters.length > 0 ? (
              <div className="chapters-list flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-2">
                {filteredChapters.map((chap) => (
                  <Link 
                    key={chap.id} 
                    to={`/manga/read/${chap.id}`} 
                    className="chapter-row flex items-center justify-between p-3.5 rounded-lg transition-all"
                  >
                    <div className="chapter-row-left flex flex-col gap-1 pr-4">
                      <span className="chapter-number font-bold text-white text-base">
                        Chapter {chap.number}
                      </span>
                      {chap.title && chap.title !== `Chapter ${chap.number}` && (
                        <span className="chapter-title text-muted text-sm line-clamp-1">
                          {chap.title}
                        </span>
                      )}
                    </div>
                    <span className="chapter-date text-muted text-xs font-semibold whitespace-nowrap">
                      {chap.date}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted">
                <AlertCircle size={32} className="mx-auto mb-2 text-muted" />
                <span>No chapters match your search query.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Metadata & Genres */}
        <div className="flex flex-col gap-8">
          <div className="details-box card-panel p-6">
            <h3 className="box-title mb-5">Details</h3>
            
            <div className="meta-info-list flex flex-col gap-4">
              <div className="meta-info-item flex justify-between py-2 border-b">
                <span className="text-muted font-medium">Author</span>
                <span className="text-white font-bold">{manga.author}</span>
              </div>
              <div className="meta-info-item flex justify-between py-2 border-b">
                <span className="text-muted font-medium">Year</span>
                <span className="text-white font-bold">{manga.year}</span>
              </div>
              <div className="meta-info-item flex justify-between py-2 border-b">
                <span className="text-muted font-medium">Status</span>
                <span className="text-white font-bold capitalize">{manga.status}</span>
              </div>
              <div className="meta-info-item flex justify-between py-2 border-b">
                <span className="text-muted font-medium">Target demographic</span>
                <span className="text-white font-bold capitalize">{manga.demographic}</span>
              </div>
              <div className="meta-info-item flex justify-between py-2">
                <span className="text-muted font-medium">Age Rating</span>
                <span className="text-white font-bold uppercase">{manga.rating}</span>
              </div>
            </div>
          </div>

          {/* Genres Tags */}
          {manga.genres.length > 0 && (
            <div className="details-box card-panel p-6">
              <h3 className="box-title mb-4 flex items-center gap-2">
                <Tag size={18} className="text-primary" />
                <span>Genres</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {manga.genres.map((genre, idx) => (
                  <span key={idx} className="genre-pill text-xs font-bold px-3 py-1.5 transition-all">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
