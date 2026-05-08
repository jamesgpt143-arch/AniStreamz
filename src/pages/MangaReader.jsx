import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Settings, ArrowUp, Loader2, AlertCircle, Home } from 'lucide-react';
import { fetchMangaDex } from '../utils/mangaApi';
import './MangaReader.css';

export default function MangaReader() {
  const { chapterId } = useParams();
  const navigate = useNavigate();

  // Core content state
  const [pages, setPages] = useState([]);
  const [hash, setHash] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [chapterMeta, setChapterMeta] = useState(null);
  
  // Navigation feed state
  const [mangaId, setMangaId] = useState('');
  const [mangaTitle, setMangaTitle] = useState('');
  const [allChapters, setAllChapters] = useState([]);
  
  // UI Controls state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useDataSaver, setUseDataSaver] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide toolbar gestures on scroll down (highly optimized for 120fps mobile momentum scrolling)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const goingDown = currentScrollY > lastScrollY && currentScrollY > 120;
      
      if (goingDown && showControls) {
        setShowControls(false);
      } else if (!goingDown && !showControls) {
        setShowControls(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, showControls]);

  // Load Chapter pages and parent details
  useEffect(() => {
    const loadChapterData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch current chapter meta and discover parent manga
        const chapRes = await fetchMangaDex(`chapter/${chapterId}?includes[]=manga`);
        const chapData = await chapRes.json();
        
        if (!chapData.data) {
          throw new Error('Chapter not found on MangaDex network.');
        }

        const currentChapter = chapData.data;
        const currentMeta = {
          id: currentChapter.id,
          number: currentChapter.attributes?.chapter || '?',
          title: currentChapter.attributes?.title || `Chapter ${currentChapter.attributes?.chapter}`,
        };
        setChapterMeta(currentMeta);

        // Extract parent manga relationship details
        const mangaRel = currentChapter.relationships?.find(r => r.type === 'manga');
        if (!mangaRel) {
          throw new Error('Manga owner context is missing.');
        }

        const parentMangaId = mangaRel.id;
        setMangaId(parentMangaId);
        setMangaTitle(
          mangaRel.attributes?.title?.en || 
          Object.values(mangaRel.attributes?.title || {})[0] || 
          'Parent Manga'
        );

        // 2. Fetch CDN pages server
        const serverRes = await fetchMangaDex(`at-home/server/${chapterId}`);
        const serverData = await serverRes.json();
        
        if (serverData.result !== 'ok' || !serverData.chapter) {
          throw new Error('MangaDex CDN did not return valid pages hash.');
        }

        setBaseUrl(serverData.baseUrl);
        setHash(serverData.chapter.hash);
        
        // Save page files
        setPages({
          standard: serverData.chapter.data || [],
          saver: serverData.chapter.dataSaver || []
        });

        // 3. Load entire chapters list of the manga to support next/prev selectors
        const feedRes = await fetchMangaDex(
          `manga/${parentMangaId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=500&contentRating[]=safe&contentRating[]=suggestive`
        );
        const feedData = await feedRes.json();

        // Deduplicate feed chapters sequence
        const seenNumbers = new Set();
        const cleanList = [];
        const rawFeed = feedData.data || [];
        
        const sortedRaw = [...rawFeed].sort((a, b) => {
          const numA = parseFloat(a.attributes?.chapter) || 0;
          const numB = parseFloat(b.attributes?.chapter) || 0;
          return numA - numB;
        });

        sortedRaw.forEach(item => {
          const chNum = item.attributes?.chapter;
          if (chNum && !seenNumbers.has(chNum)) {
            seenNumbers.add(chNum);
            cleanList.push({
              id: item.id,
              number: chNum,
              title: item.attributes?.title || `Chapter ${chNum}`
            });
          }
        });

        setAllChapters(cleanList);

      } catch (err) {
        console.error(err);
        setError(err.message || 'Error occurred while loading chapter.');
      } finally {
        setLoading(false);
      }
    };

    loadChapterData();
  }, [chapterId]);

  // Derive previous and next index coordinates
  const currentChapterIndex = allChapters.findIndex(c => c.id === chapterId);
  const prevChapter = currentChapterIndex > 0 ? allChapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < allChapters.length - 1 ? allChapters[currentChapterIndex + 1] : null;

  // Render Page files mapped to URLs
  const activePageFiles = useDataSaver ? pages.saver : pages.standard;
  const pageUrls = (activePageFiles || []).map(file => 
    `${baseUrl}/${useDataSaver ? 'data-saver' : 'data'}/${hash}/${file}`
  );

  const handleChapterJump = (targetId) => {
    if (targetId) {
      navigate(`/manga/read/${targetId}`);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4 bg-black text-white">
        <Loader2 className="spinner text-primary animate-spin" size={48} />
        <p className="text-muted text-lg">Fetching CDN nodes & resolving pages...</p>
      </div>
    );
  }

  if (error || pageUrls.length === 0) {
    return (
      <div className="container py-16 min-h-screen flex flex-col justify-center items-center bg-black text-white">
        <AlertCircle className="text-red-500 mb-4" size={54} />
        <h2 className="text-2xl font-bold mb-2">Reading Node Failed</h2>
        <p className="text-muted mb-6 text-center max-w-md">
          {error || 'No pages available. The chapter files may be empty or restricted on the MangaDex CDN network.'}
        </p>
        <div className="flex gap-4">
          <Link to={`/manga/${mangaId || ''}`} className="hero-btn">
            Back to Details
          </Link>
          <Link to="/manga" className="sort-btn flex items-center px-5">
            Manga Explorer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="manga-reader-container bg-black min-h-screen text-white select-none">
      {/* Top Floating Controls */}
      <header className={`reader-header fixed top-0 left-0 right-0 z-50 flex items-center transition-all duration-300 ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="container-fluid flex justify-between items-center px-4 md:px-8 h-16 w-full">
          <div className="header-left flex items-center gap-4">
            <Link to={`/manga/${mangaId}`} className="back-circle" title="Exit Reader">
              <ChevronLeft size={24} />
            </Link>
            <div className="manga-meta flex flex-col">
              <span className="manga-nav-title text-sm text-muted font-semibold truncate max-w-[150px] md:max-w-[300px]">
                {mangaTitle}
              </span>
              <span className="chapter-nav-title text-base font-bold text-white">
                Chapter {chapterMeta?.number}
              </span>
            </div>
          </div>

          <div className="header-right flex items-center gap-3">
            {/* Direct dropdown jumper */}
            <select
              value={chapterId}
              onChange={(e) => handleChapterJump(e.target.value)}
              className="chapter-dropdown-select"
            >
              {allChapters.map(c => (
                <option key={c.id} value={c.id}>
                  Chapter {c.number} {c.title && ` - ${c.title}`}
                </option>
              ))}
            </select>

            <Link to="/manga" className="back-circle" title="Manga Explorer Home">
              <Home size={20} />
            </Link>
          </div>
        </div>
      </header>

      {/* Pages Listing Stack (Webtoon-style) */}
      <main className="reader-pages flex flex-col items-center">
        <div className="pages-stack flex flex-col items-center w-full max-w-[800px] py-20">
          {pageUrls.map((url, index) => (
            <div key={index} className="page-wrapper relative w-full flex flex-col items-center">
              <img
                src={url}
                alt={`Page ${index + 1}`}
                className="manga-page-img"
                loading="lazy"
              />
              <div className="page-footer-index py-3 text-muted text-xs font-semibold">
                Page {index + 1} of {pageUrls.length}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Option Bar */}
      <footer className={`reader-footer fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="container flex justify-between items-center h-16 px-4 md:px-8 max-w-[800px] mx-auto">
          {/* Previous Button */}
          {prevChapter ? (
            <button 
              onClick={() => handleChapterJump(prevChapter.id)}
              className="nav-arrow-btn flex items-center gap-1 font-semibold text-sm"
              title="Previous Chapter"
            >
              <ChevronLeft size={20} />
              <span className="hidden sm:inline">Ch {prevChapter.number}</span>
            </button>
          ) : (
            <button disabled className="nav-arrow-btn disabled flex items-center gap-1 text-sm">
              <ChevronLeft size={20} />
              <span className="hidden sm:inline">First Chapter</span>
            </button>
          )}

          {/* Quick Settings Group */}
          <div className="flex items-center gap-3">
            {/* Quality Switcher */}
            <button
              onClick={() => setUseDataSaver(!useDataSaver)}
              className={`quality-badge flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${useDataSaver ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-primary/20 text-primary border border-primary/30'}`}
              title={useDataSaver ? 'Switched to low-resolution fast loading' : 'Switched to original high quality'}
            >
              <Settings size={14} />
              <span>{useDataSaver ? 'Data Saver' : 'HQ Mode'}</span>
            </button>
            {/* Scroll Up */}
            <button 
              onClick={scrollToTop} 
              className="scroll-top-btn flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 h-9 w-9 text-white transition-all"
              title="Scroll back to top"
            >
              <ArrowUp size={16} />
            </button>
          </div>

          {/* Next Button */}
          {nextChapter ? (
            <button 
              onClick={() => handleChapterJump(nextChapter.id)}
              className="nav-arrow-btn flex items-center gap-1 font-semibold text-sm"
              title="Next Chapter"
            >
              <span className="hidden sm:inline">Ch {nextChapter.number}</span>
              <ChevronRight size={20} />
            </button>
          ) : (
            <button disabled className="nav-arrow-btn disabled flex items-center gap-1 text-sm">
              <span className="hidden sm:inline">End of Book</span>
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
