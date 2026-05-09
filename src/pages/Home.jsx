import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import AnimeCard from '../components/AnimeCard';
import { getHistory, getWatchlist, addToWatchlist, removeFromWatchlist } from '../utils/storage';
import './Home.css';

function getWeekDates() {
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  
  const current = new Date();
  const currentDayIndex = current.getDay();
  
  const monday = new Date(current);
  const distanceToMonday = currentDayIndex === 0 ? -6 : 1 - currentDayIndex;
  monday.setDate(current.getDate() + distanceToMonday);
  
  const week = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    
    week.push({
      dateStr: `${months[dayDate.getMonth()]} ${dayDate.getDate()}`,
      dayStr: daysOfWeek[dayDate.getDay()],
      fullDayName: dayDate.toLocaleDateString('en-US', { weekday: 'long' }),
      isToday: dayDate.toDateString() === current.toDateString()
    });
  }
  return week;
}

function convertJstTimeToPht(timeStr) {
  if (!timeStr) return '00:00 PM';
  const [hours, minutes] = timeStr.split(':').map(Number);
  let newHours = hours - 1;
  if (newHours < 0) {
    newHours = 23;
  }
  const ampm = newHours >= 12 ? 'PM' : 'AM';
  let hours12 = newHours % 12;
  hours12 = hours12 ? hours12 : 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

function calculateAiringEpisode(airedFromStr, totalEpisodes) {
  if (!airedFromStr) return 1;
  try {
    const fromDate = new Date(airedFromStr);
    if (isNaN(fromDate.getTime())) return 1;
    
    const currentDate = new Date();
    const diffMs = currentDate.getTime() - fromDate.getTime();
    if (diffMs < 0) return 1;
    
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const estimatedEpisode = diffWeeks + 1;
    
    if (totalEpisodes && estimatedEpisode > totalEpisodes) {
      return totalEpisodes;
    }
    return estimatedEpisode;
  } catch {
    return 1;
  }
}

export default function Home() {
  const [recentAnimes, setRecentAnimes] = useState([]);
  const [searchAnimes, setSearchAnimes] = useState([]);
  const [history, setHistory] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  // Pagination States for Recent Releases
  const [recentPage, setRecentPage] = useState(1);
  const [hasMoreRecent, setHasMoreRecent] = useState(true);
  const [loadingMoreRecent, setLoadingMoreRecent] = useState(false);

  // Featured Anime Slider States
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  // Weekly Schedule States
  const [scheduleData, setScheduleData] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [selectedDay, setSelectedDay] = useState('');
  const [showAllSchedule, setShowAllSchedule] = useState(false);
  const [nowTime, setNowTime] = useState('');
  const [weekDays, setWeekDays] = useState([]);

  // Top Trending Sidebar States
  const [trendingAnimes, setTrendingAnimes] = useState([]);
  const [trendingFilter, setTrendingFilter] = useState('NOW'); // NOW, DAY, WEEK, MONTH
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [showTrendingDropdown, setShowTrendingDropdown] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q')?.toLowerCase() || '';

  // Auto-slide featured list every 8 seconds
  useEffect(() => {
    if (recentAnimes.length === 0 || query) return;
    const slideTimer = setInterval(() => {
      setActiveFeatureIndex((prev) => (prev + 1) % Math.min(10, recentAnimes.length));
    }, 8000);
    return () => clearInterval(slideTimer);
  }, [recentAnimes.length, query]);

  // Fetch trending animes on filter changes
  useEffect(() => {
    if (query) return; // Don't fetch trending during active queries

    setLoadingTrending(true);
    let filterQuery = 'airing';
    if (trendingFilter === 'NOW' || trendingFilter === 'DAY') {
      filterQuery = 'airing';
    } else if (trendingFilter === 'WEEK') {
      filterQuery = 'bypopularity';
    } else {
      filterQuery = 'favorite';
    }

    fetch(`https://api.jikan.moe/v4/top/anime?filter=${filterQuery}&limit=10`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          const mapped = data.data.map((item) => ({
            id: `mal-${item.mal_id}`,
            title: item.title,
            poster: item.images?.jpg?.small_image_url || item.images?.jpg?.image_url,
            score: item.score,
            status: item.status,
            type: item.type,
            episodes: item.episodes
          }));
          setTrendingAnimes(mapped);
        }
      })
      .catch((err) => console.error('Failed to fetch trending:', err))
      .finally(() => setLoadingTrending(false));
  }, [trendingFilter, query]);

  // Fetch recent animes with pagination
  useEffect(() => {
    if (recentPage === 1) {
      setLoading(true);
    } else {
      setLoadingMoreRecent(true);
    }

    fetch(`/api/recent-anime?page=${recentPage}&per_page=24`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.ok) {
          if (recentPage === 1) {
            setRecentAnimes(data.data);
          } else {
            setRecentAnimes((prev) => [...prev, ...data.data]);
          }
          if (data.data.length < 24) {
            setHasMoreRecent(false);
          }
        } else {
          setHasMoreRecent(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch recent:', err);
      })
      .finally(() => {
        setLoading(false);
        setLoadingMoreRecent(false);
      });
  }, [recentPage]);

  // Load weekly schedule clock and days row on mount
  useEffect(() => {
    const week = getWeekDates();
    setWeekDays(week);
    const today = week.find((d) => d.isToday) || week[0];
    setSelectedDay(today.fullDayName);

    const updateClock = () => {
      const d = new Date();
      const formattedDate = d.toLocaleDateString('en-GB'); // DD/MM/YYYY
      const formattedTime = d.toLocaleTimeString('en-US', { hour12: false }); // HH:MM:SS
      setNowTime(`${formattedDate} ${formattedTime}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch schedule for the specific day when it changes
  useEffect(() => {
    if (!selectedDay) return;

    setLoadingSchedule(true);
    fetch(`https://api.jikan.moe/v4/schedules?filter=${selectedDay.toLowerCase()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch schedule');
        return res.json();
      })
      .then((data) => {
        if (data.data) {
          setScheduleData(data.data);
        } else {
          setScheduleData([]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch schedule:', err);
        setScheduleData([]);
      })
      .finally(() => setLoadingSchedule(false));
  }, [selectedDay]);

  // Fetch search results when query changes
  useEffect(() => {
    if (query) {
      setLoading(true);
      fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=24`)
        .then((res) => res.json())
        .then((data) => {
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
            setSearchAnimes(mapped);
          }
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to fetch search results.');
        })
        .finally(() => setLoading(false));
    } else {
      setSearchAnimes([]);
      setLoading(recentAnimes.length === 0);
      if (recentAnimes.length > 0) setLoading(false);
    }
  }, [query, recentAnimes]);

  useEffect(() => {
    setHistory(getHistory());
    setWatchlist(getWatchlist());
  }, [location]);

  const displayAnimes = query ? searchAnimes : recentAnimes;
  const featuredList = recentAnimes.length > 0 && !query ? recentAnimes.slice(0, 10) : [];
  const featuredAnime = featuredList[activeFeatureIndex] || null;

  const [watchlistUpdated, setWatchlistUpdated] = useState(0);
  const isFeaturedBookmarked = featuredAnime ? getWatchlist().some(item => item.id === featuredAnime.id) : false;

  const handleBookmarkToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!featuredAnime) return;
    if (isFeaturedBookmarked) {
      removeFromWatchlist(featuredAnime.id);
    } else {
      addToWatchlist({
        id: featuredAnime.id,
        title: featuredAnime.title,
        poster: featuredAnime.poster || featuredAnime.background_image,
        score: featuredAnime.score,
        status: featuredAnime.status
      });
    }
    setWatchlistUpdated(prev => prev + 1);
  };

  const handleNextSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveFeatureIndex((prev) => (prev + 1) % featuredList.length);
  };

  const handlePrevSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveFeatureIndex((prev) => (prev - 1 + featuredList.length) % featuredList.length);
  };

  return (
    <div className="home-page">
      {featuredAnime && (
        <div className="featured-banner flex items-end">
          <div 
            className="featured-blur-bg" 
            style={{ backgroundImage: `url(${featuredAnime.background_image || featuredAnime.poster})` }}
          ></div>
          <div className="featured-image-container">
            <img 
              src={featuredAnime.background_image || featuredAnime.poster} 
              alt={featuredAnime.title} 
              className="featured-image"
            />
          </div>
          <div className="featured-overlay"></div>
          
          <div className="container featured-content pb-8">
            {/* Badges and meta info row */}
            <div className="featured-badges-row flex items-center gap-2 mb-4">
              <span className="badge-capsule badge-orange">
                CC {featuredAnime.episodes || '??'}
              </span>
              {featuredAnime.rating && (
                <span className="badge-capsule badge-green">
                  {featuredAnime.rating.replace('PG', '').trim()}
                </span>
              )}
              <span className="featured-meta-text font-bold">
                {featuredAnime.terms_by_type?.type?.[0] || 'TV'}
              </span>
              {featuredAnime.terms_by_type?.genre && featuredAnime.terms_by_type.genre.length > 0 && (
                <span className="featured-meta-text text-muted">
                  {featuredAnime.terms_by_type.genre.slice(0, 3).join(', ')}
                </span>
              )}
            </div>
            
            <h1 className="featured-title">{featuredAnime.title}</h1>
            
            {/* Description */}
            {featuredAnime.description && (
              <p className="featured-description mb-6">
                {featuredAnime.description.length > 200 
                  ? featuredAnime.description.substring(0, 200) + '...' 
                  : featuredAnime.description}
              </p>
            )}

            {/* Premium Metadata Card Box */}
            <div className="featured-meta-box">
              <div className="meta-item">
                <span className="meta-label">Rating</span>
                <span className="meta-value">{featuredAnime.rating || 'N/A'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Release</span>
                <span className="meta-value">{featuredAnime.year || '2026'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Quality</span>
                <span className="meta-value">HD</span>
              </div>
            </div>

            {/* Premium CTA Button Row */}
            <div className="featured-actions flex items-center gap-4 mt-6">
              <Link to={`/anime/${featuredAnime.id}`} className="btn-watch-now-premium">
                WATCH NOW
              </Link>
              <button 
                onClick={handleBookmarkToggle} 
                className={`btn-bookmark-premium ${isFeaturedBookmarked ? 'bookmarked' : ''}`}
                aria-label="Bookmark anime"
              >
                <Bookmark size={20} fill={isFeaturedBookmarked ? "#ffffff" : "none"} color="#ffffff" />
              </button>
            </div>
          </div>

          {/* Slide Indicator Navigation */}
          {featuredList.length > 1 && (
            <div className="featured-navigation">
              <button onClick={handlePrevSlide} className="nav-arrow" aria-label="Previous slide">
                <ChevronLeft size={20} />
              </button>
              <span className="nav-pagination-text">
                <span className="current-index">{activeFeatureIndex + 1}</span>
                <span className="divider">/</span>
                <span className="total-slides">{featuredList.length}</span>
              </span>
              <button onClick={handleNextSlide} className="nav-arrow" aria-label="Next slide">
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="container">
        {history.length > 0 && !query && (
          <div className="shelf-section mb-8 mt-8">
            <h2 className="section-title mb-4">Continue Watching</h2>
            <div className="shelf-scroll-container">
              {history.map((item) => (
                <div key={item.animeId} className="shelf-card glass-panel">
                  <Link to={`/watch/${item.animeId}/${item.episodeEmbedId}`} className="shelf-link">
                    <div className="shelf-img-wrapper">
                      <img src={item.animePoster} alt={item.animeTitle} className="shelf-img" />
                      <div className="shelf-badge">Ep {item.episodeNumber}</div>
                    </div>
                    <div className="shelf-info">
                      <div className="shelf-title">{item.animeTitle}</div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}



        <div className="main-content-split">
          <div className="main-content-left">
            <div className="section-header flex justify-between items-center">
              <h2 className="section-title">
                {query ? `Search Results for "${query}"` : 'Recent Releases'}
              </h2>
            </div>

            {loading ? (
              <div className="loading-state flex justify-center items-center">Loading...</div>
            ) : error ? (
              <div className="error-state flex justify-center items-center text-accent py-8">
                Error: {error}
              </div>
            ) : displayAnimes.length > 0 ? (
              <>
                <div className="anime-grid">
                  {displayAnimes.map((anime) => (
                    <AnimeCard key={anime.id} anime={anime} />
                  ))}
                </div>

                {!query && hasMoreRecent && (
                  <div className="load-more-container">
                    <button 
                      onClick={() => setRecentPage((prev) => prev + 1)}
                      disabled={loadingMoreRecent}
                      className="btn-load-more"
                    >
                      {loadingMoreRecent ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state text-muted py-8 text-center">
                No anime found for your search.
              </div>
            )}
          </div>

          {/* Top Trending Sidebar */}
          {!query && (
            <aside className="main-content-right">
              <div className="trending-sidebar-container glass-panel">
                <div className="trending-sidebar-header">
                  <div className="trending-title-row">
                    <span className="trophy-emoji">🏆</span>
                    <h3 className="trending-title-text font-bold">Top Trending</h3>
                  </div>
                  
                  {/* Dropdown filter selector */}
                  <div className="trending-filter-wrapper">
                    <button 
                      className="btn-trending-dropdown"
                      onClick={() => setShowTrendingDropdown(!showTrendingDropdown)}
                    >
                      <span>{trendingFilter}</span>
                      <span className="chevron-icon">▼</span>
                    </button>
                    
                    {showTrendingDropdown && (
                      <div className="trending-dropdown-options glass-panel">
                        {['NOW', 'DAY', 'WEEK', 'MONTH'].map((f) => (
                          <div 
                            key={f} 
                            className={`trending-dropdown-option ${trendingFilter === f ? 'active' : ''}`}
                            onClick={() => {
                              setTrendingFilter(f);
                              setShowTrendingDropdown(false);
                            }}
                          >
                            {f}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="trending-list-wrapper">
                  {loadingTrending ? (
                    <div className="loading-trending-state">Loading trending...</div>
                  ) : trendingAnimes.length > 0 ? (
                    <div className="trending-list">
                      {trendingAnimes.map((anime, index) => (
                        <Link to={`/anime/${anime.id}`} key={anime.id} className="trending-item-link">
                          <div className="trending-card">
                            <div className={`trending-rank rank-${index + 1}`}>
                              {String(index + 1).padStart(2, '0')}
                            </div>
                            
                            <div className="trending-item-details">
                              <h4 className="trending-item-title line-clamp-1">{anime.title}</h4>
                              <div className="trending-item-meta">
                                {anime.episodes && (
                                  <span className="trending-meta-badge cc">CC {anime.episodes}</span>
                                )}
                                {anime.score && (
                                  <span className="trending-meta-badge sub">⭐ {anime.score}</span>
                                )}
                                <span className="trending-meta-badge type">{anime.type || 'TV'}</span>
                              </div>
                            </div>

                            <div className="trending-item-img-wrapper">
                              <img src={anime.poster} alt={anime.title} className="trending-item-img" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-trending-state">No trending data found.</div>
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Estimated Schedule Section */}
        {!query && (
          <div className="schedule-section">
            <div className="schedule-header">
              <h2 className="schedule-title">Estimated Schedule</h2>
              <span className="schedule-now-time">Now: {nowTime}</span>
            </div>

            <div className="schedule-days-row">
              {weekDays.map((wd) => (
                <div 
                  key={wd.dayStr}
                  onClick={() => {
                    setSelectedDay(wd.fullDayName);
                    setShowAllSchedule(false);
                  }}
                  className={`schedule-day-card ${wd.isToday ? 'today' : ''} ${selectedDay === wd.fullDayName ? 'active' : ''}`}
                >
                  <span className="schedule-day-month">{wd.dateStr}</span>
                  <span className="schedule-day-name">{wd.dayStr}</span>
                </div>
              ))}
            </div>

            {loadingSchedule ? (
              <div className="loading-state flex justify-center items-center py-8">Loading schedule...</div>
            ) : (
              (() => {
                // De-duplicate by mal_id
                const uniqueSchedule = [];
                const seenIds = new Set();
                scheduleData.forEach(item => {
                  if (item.mal_id && !seenIds.has(item.mal_id)) {
                    seenIds.add(item.mal_id);
                    uniqueSchedule.push(item);
                  }
                });

                // Helper to get total minutes in Philippine Time (PHT) from midnight
                const getPhtMinutes = (timeStr) => {
                  if (!timeStr) return 0;
                  const [hours, minutes] = timeStr.split(':').map(Number);
                  let phtHours = hours - 1; // PHT is 1 hour behind JST
                  if (phtHours < 0) {
                    phtHours = 23;
                  }
                  return phtHours * 60 + minutes;
                };

                const sorted = [...uniqueSchedule].sort((a, b) => {
                  return getPhtMinutes(a.broadcast?.time) - getPhtMinutes(b.broadcast?.time);
                });

                if (sorted.length === 0) {
                  return <div className="schedule-empty">No episodes scheduled for {selectedDay}.</div>;
                }

                const displayList = showAllSchedule ? sorted : sorted.slice(0, 8);

                return (
                  <>
                    <div className="schedule-list">
                      {displayList.map((item) => {
                        const epNum = calculateAiringEpisode(item.aired?.from, item.episodes);
                        return (
                          <div key={item.mal_id} className="schedule-row">
                            <span className="schedule-row-time">
                              {convertJstTimeToPht(item.broadcast?.time)}
                            </span>
                            <Link to={`/anime/mal-${item.mal_id}`} className="schedule-row-title">
                              {item.title}
                            </Link>
                            <Link to={`/watch/mal-${item.mal_id}/${epNum}`} className="schedule-row-action">
                              <span>▶ Ep {epNum}</span>
                            </Link>
                          </div>
                        );
                      })}
                    </div>

                    {sorted.length > 8 && (
                      <div className="schedule-toggle-container">
                        <button 
                          className="btn-schedule-toggle"
                          onClick={() => setShowAllSchedule(!showAllSchedule)}
                        >
                          {showAllSchedule ? 'Show Less ▲' : 'Show More ▼'}
                        </button>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        )}
      </div>
    </div>
  );
}


