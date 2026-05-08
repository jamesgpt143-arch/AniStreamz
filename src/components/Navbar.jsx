import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Play, Search, Home as HomeIcon, Compass, Heart, BookOpen } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim() || searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }
      setIsSearching(true);
      try {
        if (currentPath.startsWith('/manga')) {
          const res = await fetch(`https://api.mangadex.org/manga?limit=5&title=${encodeURIComponent(searchQuery)}&includes[]=cover_art`);
          const data = await res.json();
          const mapped = (data.data || []).map(manga => {
            const coverRel = manga.relationships?.find(r => r.type === 'cover_art');
            const fileName = coverRel?.attributes?.fileName;
            return {
              id: manga.id,
              title: manga.attributes?.title?.en || Object.values(manga.attributes?.title || {})[0] || 'Unknown Title',
              poster: fileName 
                ? `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.256.jpg`
                : 'https://via.placeholder.com/150',
              type: manga.attributes?.publicationDemographic || manga.attributes?.status || 'Manga',
              isManga: true
            };
          });
          setSuggestions(mapped);
        } else {
          const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchQuery)}&limit=5`);
          const data = await res.json();
          setSuggestions(data.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery, currentPath]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowDropdown(false);
      if (currentPath.startsWith('/manga')) {
        navigate(`/manga?q=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    } else {
      if (currentPath.startsWith('/manga')) {
        navigate('/manga');
      } else {
        navigate('/');
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setShowDropdown(false);
    setSearchQuery('');
    if (suggestion.isManga) {
      navigate(`/manga/${suggestion.id}`);
    } else {
      navigate(`/anime/mal-${suggestion.mal_id}`);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="container flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 logo-link">
            <Play className="logo-icon text-accent" size={28} fill="currentColor" />
            <span className="logo-text text-gradient">AniStreamz</span>
          </Link>
          <div className="nav-actions flex items-center gap-6">
            <div className="nav-links">
              <Link to="/" className={`nav-link ${currentPath === '/' ? 'active' : ''}`}>Home</Link>
              <Link to="/browse" className={`nav-link ${currentPath === '/browse' ? 'active' : ''}`}>Browse</Link>
              <Link to="/watchlist" className={`nav-link ${currentPath === '/watchlist' ? 'active' : ''}`}>Watchlist</Link>
              <Link to="/manga" className={`nav-link ${currentPath.startsWith('/manga') ? 'active' : ''}`}>Manga</Link>
            </div>
            <div className="search-container" ref={dropdownRef}>
              <form onSubmit={handleSearch} className="search-form flex items-center">
                <input
                  type="text"
                  placeholder={currentPath.startsWith('/manga') ? "Search any manga..." : "Search any anime..."}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="search-input"
                />
                <button type="submit" className="search-btn">
                  <Search size={18} />
                </button>
              </form>
              
              {showDropdown && searchQuery.length >= 3 && (
                <div className="search-dropdown glass-panel">
                  {isSearching ? (
                    <div className="dropdown-item text-muted">Searching...</div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((item) => (
                      <div 
                        key={item.id || item.mal_id} 
                        className="dropdown-item flex items-center gap-3"
                        onClick={() => handleSuggestionClick(item)}
                      >
                        <img 
                          src={item.poster || item.images?.jpg?.small_image_url} 
                          alt={item.title} 
                          className="dropdown-img"
                        />
                        <div className="dropdown-info">
                          <div className="dropdown-title">{item.title}</div>
                          <div className="dropdown-meta text-muted flex items-center gap-2">
                            {item.isManga ? (
                              <span className="capitalize">{item.type}</span>
                            ) : (
                              <>
                                {item.score && (
                                  <span className="dropdown-star">★ {item.score}</span>
                                )}
                                <span>•</span>
                                <span>{item.type || 'TV'}</span>
                                {item.year && (
                                  <>
                                    <span>•</span>
                                    <span>{item.year}</span>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-item text-muted">No results found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation Bar for Mobile */}
      <div className="bottom-nav">
        <Link to="/" className={`bottom-nav-item ${currentPath === '/' ? 'active' : ''}`}>
          <HomeIcon size={20} />
          <span className="bottom-nav-label">Home</span>
        </Link>
        <Link to="/browse" className={`bottom-nav-item ${currentPath === '/browse' ? 'active' : ''}`}>
          <Compass size={20} />
          <span className="bottom-nav-label">Browse</span>
        </Link>
        <Link to="/watchlist" className={`bottom-nav-item ${currentPath === '/watchlist' ? 'active' : ''}`}>
          <Heart size={20} />
          <span className="bottom-nav-label">Watchlist</span>
        </Link>
        <Link to="/manga" className={`bottom-nav-item ${currentPath.startsWith('/manga') ? 'active' : ''}`}>
          <BookOpen size={20} />
          <span className="bottom-nav-label">Manga</span>
        </Link>
      </div>
    </>
  );
}
