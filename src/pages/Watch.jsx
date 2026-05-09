import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import EpisodeList from '../components/EpisodeList';
import { saveToHistory } from '../utils/storage';
import './Watch.css';

function convertJstToPht(day, timeStr) {
  if (!day || !timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  const daysOfWeek = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
  let dayIndex = daysOfWeek.indexOf(day);
  if (dayIndex === -1) return null;

  let newHours = hours - 1;
  let newDayIndex = dayIndex;

  if (newHours < 0) {
    newHours = 23;
    newDayIndex = (dayIndex - 1 + 7) % 7;
  }

  // Convert to 12-hour format
  const ampm = newHours >= 12 ? 'PM' : 'AM';
  let hours12 = newHours % 12;
  hours12 = hours12 ? hours12 : 12; // the hour '0' should be '12'
  const formattedTime = `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;

  const newDay = daysOfWeek[newDayIndex];
  return `${newDay} at ${formattedTime} (Philippine Time)`;
}

const GENRE_MAP = {
  'action': 1,
  'adventure': 2,
  'comedy': 4,
  'mystery': 7,
  'drama': 8,
  'ecchi': 9,
  'fantasy': 10,
  'game': 11,
  'historical': 13,
  'horror': 14,
  'kids': 15,
  'martial arts': 17,
  'mecha': 18,
  'music': 19,
  'parody': 20,
  'romance': 22,
  'school': 23,
  'sci-fi': 24,
  'shounen': 27,
  'sports': 30,
  'super power': 31,
  'slice of life': 36,
  'supernatural': 37,
  'suspense': 41,
  'seinen': 42
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchDetailsForRelations(relations) {
  const list = [];
  for (const rel of relations) {
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${rel.mal_id}`);
      if (res.status === 429) {
        await sleep(1000); // Back off and retry once
        const retryRes = await fetch(`https://api.jikan.moe/v4/anime/${rel.mal_id}`);
        const data = await retryRes.json();
        if (data.data) {
          list.push({
            id: `mal-${data.data.mal_id}`,
            title: data.data.title,
            poster: data.data.images?.jpg?.large_image_url || data.data.images?.jpg?.image_url,
            badge: rel.relation,
            isRelation: true
          });
        }
      } else {
        const data = await res.json();
        if (data.data) {
          list.push({
            id: `mal-${data.data.mal_id}`,
            title: data.data.title,
            poster: data.data.images?.jpg?.large_image_url || data.data.images?.jpg?.image_url,
            badge: rel.relation,
            isRelation: true
          });
        }
      }
    } catch (err) {
      console.error(`Failed to fetch details for relation ID ${rel.mal_id}:`, err);
    }
    await sleep(350); // Respect Jikan's rate limits
  }
  return list;
}

export default function Watch() {
  const { id, episode_embed_id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [showCountdownOverlay, setShowCountdownOverlay] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (id.startsWith('mal-')) {
          const malId = id.replace('mal-', '');
          const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
          const resData = await res.json();
          if (resData.data) {
            const item = resData.data;
            let epsCount = item.episodes || 12;

            if (item.status === 'Currently Airing') {
              try {
                const epRes = await fetch(`https://api.jikan.moe/v4/anime/${malId}/episodes`);
                const epData = await epRes.json();
                let apiEpsCount = 0;
                if (epData.data && epData.data.length > 0) {
                  apiEpsCount = epData.data.length;
                }

                let estimatedEpsCount = 1;
                if (item.aired?.from) {
                  const startDate = new Date(item.aired.from);
                  const now = new Date();
                  if (now >= startDate) {
                    const diffMs = now.getTime() - startDate.getTime();
                    const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
                    estimatedEpsCount = diffWeeks + 1;
                  }
                }

                epsCount = Math.max(apiEpsCount, estimatedEpsCount);
                if (item.episodes && epsCount > item.episodes) {
                  epsCount = item.episodes;
                }
              } catch (e) {
                console.error('Failed to fetch aired episodes:', e);
                epsCount = 1;
              }
            }

            const animeObj = {
              id: `mal-${item.mal_id}`,
              title: item.title,
              alternative: item.title_english || item.title_japanese,
              poster: item.images?.jpg?.large_image_url,
              background_image: item.images?.jpg?.large_image_url,
              description: item.synopsis,
              rating: item.rating,
              score: item.score,
              year: item.year,
              status: item.status,
              terms_by_type: { genre: item.genres?.map(g => g.name) },
              next_episode_schedule: item.status === 'Currently Airing' && item.broadcast?.day && item.broadcast?.time
                ? `Next episode: ${convertJstToPht(item.broadcast.day, item.broadcast.time)}` 
                : null
            };

            const epsObj = Array.from({length: epsCount}, (_, i) => ({
              id: `ep-${i+1}`,
              number: i+1,
              title: `Episode ${i+1}`,
              episode_embed_id: String(i+1),
              embed_url: { 
                sub: `https://megaplay.buzz/stream/mal/${item.mal_id}/${i+1}/sub`,
                dub: `https://megaplay.buzz/stream/mal/${item.mal_id}/${i+1}/dub`
              }
            }));
            setSeasons([{
              mal_id: Number(malId),
              name: item.title,
              relation: 'Current',
              isCurrent: true
            }]);
            setData({ anime: animeObj, episodes: epsObj });

            // Fetch relations first, and fall back to similar genres
            let finalRecommendations = [];
            try {
              const relRes = await fetch(`https://api.jikan.moe/v4/anime/${malId}/relations`);
              const relData = await relRes.json();
              if (relData.data && relData.data.length > 0) {
                const eligibleRelations = [];
                const tempSeasons = [];
                relData.data.forEach(relGroup => {
                  const relName = relGroup.relation;

                  // Parse season relations
                  const validSeasonTypes = [
                    'Prequel', 
                    'Sequel', 
                    'Alternative version', 
                    'Alternative setting', 
                    'Parent story',
                    'Full story',
                    'Spin-off',
                    'Other'
                  ];
                  if (validSeasonTypes.includes(relName)) {
                    relGroup.entry.forEach(entry => {
                      if (entry.type === 'anime') {
                        if (!tempSeasons.some(s => s.mal_id === entry.mal_id) && entry.mal_id !== Number(malId)) {
                          tempSeasons.push({
                            mal_id: entry.mal_id,
                            name: entry.name,
                            relation: relName,
                            isCurrent: false
                          });
                        }
                      }
                    });
                  }

                  if (relName !== 'Character' && relName !== 'Adaptation') {
                    relGroup.entry.forEach(entry => {
                      if (entry.type === 'anime') {
                        if (!eligibleRelations.some(r => r.mal_id === entry.mal_id)) {
                          eligibleRelations.push({
                            mal_id: entry.mal_id,
                            name: entry.name,
                            relation: relName
                          });
                        }
                      }
                    });
                  }
                });

                // Chronological season sorting
                const parents = tempSeasons.filter(s => s.relation === 'Parent story');
                const prequels = tempSeasons.filter(s => s.relation === 'Prequel');
                const sequels = tempSeasons.filter(s => s.relation === 'Sequel');
                const others = tempSeasons.filter(s => !['Parent story', 'Prequel', 'Sequel'].includes(s.relation));

                const sortedSeasons = [
                  ...parents,
                  ...prequels,
                  {
                    mal_id: Number(malId),
                    name: item.title,
                    relation: 'Current',
                    isCurrent: true
                  },
                  ...sequels,
                  ...others
                ];
                setSeasons(sortedSeasons);

                if (eligibleRelations.length > 0) {
                  const relationItems = await fetchDetailsForRelations(eligibleRelations.slice(0, 4));
                  finalRecommendations = relationItems;
                }
              }
            } catch (err) {
              console.error('Failed to fetch relations:', err);
            }

            // Fill up with similar genres if we have fewer than 4 relations
            if (finalRecommendations.length < 4) {
              const neededCount = 4 - finalRecommendations.length;
              const genreIds = item.genres?.map(g => g.mal_id) || [];
              if (genreIds.length > 0) {
                let genreResults = [];
                // Try fetching with first 2 genres for better specificity
                try {
                  const primaryGenres = genreIds.slice(0, 2);
                  const genRes = await fetch(`https://api.jikan.moe/v4/anime?genres=${primaryGenres.join(',')}&limit=12&order_by=score&sort=desc`);
                  const genData = await genRes.json();
                  if (genData.data && genData.data.length > 0) {
                    genreResults = genData.data;
                  }
                } catch (e) {
                  console.error('Failed fetching with multiple genres:', e);
                }

                // Fallback to first genre if no results
                if (genreResults.length === 0) {
                  try {
                    const genRes = await fetch(`https://api.jikan.moe/v4/anime?genres=${genreIds[0]}&limit=12&order_by=score&sort=desc`);
                    const genData = await genRes.json();
                    if (genData.data && genData.data.length > 0) {
                      genreResults = genData.data;
                    }
                  } catch (e) {
                    console.error('Failed fetching with first genre:', e);
                  }
                }

                if (genreResults.length > 0) {
                  const filteredGenreItems = genreResults
                    .filter(gItem => 
                      gItem.mal_id !== item.mal_id &&
                      !finalRecommendations.some(rec => rec.id === `mal-${gItem.mal_id}`)
                    )
                    .slice(0, neededCount)
                    .map(gItem => ({
                      id: `mal-${gItem.mal_id}`,
                      title: gItem.title,
                      poster: gItem.images?.jpg?.large_image_url || gItem.images?.jpg?.image_url,
                      badge: gItem.genres?.[0]?.name || 'Anime',
                      isRelation: false
                    }));
                  
                  finalRecommendations = [...finalRecommendations, ...filteredGenreItems];
                }
              }
            }

            // Ultimate fallback to top anime
            if (finalRecommendations.length < 4) {
              const neededCount = 4 - finalRecommendations.length;
              try {
                const fbRes = await fetch('https://api.jikan.moe/v4/top/anime?limit=10');
                const fbData = await fbRes.json();
                if (fbData.data) {
                  const fbItems = fbData.data
                    .filter(topItem => 
                      topItem.mal_id !== item.mal_id &&
                      !finalRecommendations.some(rec => rec.id === `mal-${topItem.mal_id}`)
                    )
                    .slice(0, neededCount)
                    .map(topItem => ({
                      id: `mal-${topItem.mal_id}`,
                      title: topItem.title,
                      poster: topItem.images?.jpg?.large_image_url || topItem.images?.jpg?.image_url,
                      badge: 'Popular',
                      isRelation: false
                    }));
                  finalRecommendations = [...finalRecommendations, ...fbItems];
                }
              } catch (err) {
                console.error('Failed to fetch fallback top anime:', err);
              }
            }

            setRecommendations(finalRecommendations);
          }
        } else {
          setSeasons([]);
          const res = await fetch(`/api/series/${id}`);
          const resData = await res.json();
          if (resData.ok) {
            const seriesData = resData.data;
            const anime = seriesData.anime;
            
            let next_episode_schedule = null;
            if (anime.status === 'Currently Airing' && anime.next_air_schedule_time) {
              const airDate = new Date(anime.next_air_schedule_time * 1000);
              const formattedDate = airDate.toLocaleString('en-US', { timeZone: 'Asia/Manila', hour12: true });
              next_episode_schedule = `Next Episode (Ep ${anime.next_air_ep || ''}) Airs: ${formattedDate} (PHT)`;
            }

            setData({
              anime: {
                ...anime,
                next_episode_schedule
              },
              episodes: seriesData.episodes
            });

            // Fetch similar genre recommendations for custom series
            let finalRecommendations = [];
            const genreNames = anime.terms_by_type?.genre || [];
            const mappedGenreIds = genreNames
              .map(name => GENRE_MAP[name.toLowerCase()])
              .filter(Boolean);

            if (mappedGenreIds.length > 0) {
              let genreResults = [];
              try {
                const primaryGenres = mappedGenreIds.slice(0, 2);
                const genRes = await fetch(`https://api.jikan.moe/v4/anime?genres=${primaryGenres.join(',')}&limit=10&order_by=score&sort=desc`);
                const genData = await genRes.json();
                if (genData.data && genData.data.length > 0) {
                  genreResults = genData.data;
                }
              } catch (e) {
                console.error('Failed fetching genres for custom series:', e);
              }

              if (genreResults.length === 0) {
                try {
                  const genRes = await fetch(`https://api.jikan.moe/v4/anime?genres=${mappedGenreIds[0]}&limit=10&order_by=score&sort=desc`);
                  const genData = await genRes.json();
                  if (genData.data && genData.data.length > 0) {
                    genreResults = genData.data;
                  }
                } catch (e) {
                  console.error('Failed fetching single genre for custom series:', e);
                }
              }

              if (genreResults.length > 0) {
                finalRecommendations = genreResults.slice(0, 4).map(gItem => ({
                  id: `mal-${gItem.mal_id}`,
                  title: gItem.title,
                  poster: gItem.images?.jpg?.large_image_url || gItem.images?.jpg?.image_url,
                  badge: gItem.genres?.[0]?.name || 'Anime',
                  isRelation: false
                }));
              }
            }

            // Fallback to top anime if needed
            if (finalRecommendations.length < 4) {
              const neededCount = 4 - finalRecommendations.length;
              try {
                const fbRes = await fetch('https://api.jikan.moe/v4/top/anime?limit=10');
                const fbData = await fbRes.json();
                if (fbData.data) {
                  const fbItems = fbData.data
                    .slice(0, neededCount)
                    .map(topItem => ({
                      id: `mal-${topItem.mal_id}`,
                      title: topItem.title,
                      poster: topItem.images?.jpg?.large_image_url || topItem.images?.jpg?.image_url,
                      badge: 'Popular',
                      isRelation: false
                    }));
                  finalRecommendations = [...finalRecommendations, ...fbItems];
                }
              } catch (err) {
                console.error('Failed to fetch fallback top anime for custom series:', err);
              }
            }

            setRecommendations(finalRecommendations);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const anime = data?.anime;
  const episodes = data?.episodes || [];
  const currentEpisode = episodes.find((ep) => ep.episode_embed_id === episode_embed_id) || episodes[0];
  const currentIndex = episodes.findIndex((ep) => ep.episode_embed_id === currentEpisode?.episode_embed_id);
  const nextEpisode = currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

  useEffect(() => {
    if (anime && currentEpisode) {
      saveToHistory(anime, currentEpisode);
    }
  }, [anime, currentEpisode]);

  useEffect(() => {
    let timer;
    if (showCountdownOverlay && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (showCountdownOverlay && countdown === 0) {
      if (nextEpisode) {
        setShowCountdownOverlay(false);
        setCountdown(5);
        navigate(`/watch/${id}/${nextEpisode.episode_embed_id}`);
      }
    }
    return () => clearTimeout(timer);
  }, [showCountdownOverlay, countdown, nextEpisode, id, navigate]);

  useEffect(() => {
    setShowCountdownOverlay(false);
    setCountdown(5);
  }, [episode_embed_id]);

  useEffect(() => {
    const handlePlayerMessage = (event) => {
      try {
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        const eventName = msg?.event || msg?.status || msg?.type;
        
        // Listen for standard ended/completed messages emitted by player iframes
        if (['ended', 'completed', 'player_ended', 'onEnded'].includes(eventName)) {
          const autoplayEnabled = localStorage.getItem('anistreamz_autoplay') !== 'false';
          if (autoplayEnabled && nextEpisode) {
            setCountdown(5);
            setShowCountdownOverlay(true);
          }
        }
      } catch {
        // Safe to ignore non-JSON signals
      }
    };

    window.addEventListener('message', handlePlayerMessage);
    return () => window.removeEventListener('message', handlePlayerMessage);
  }, [nextEpisode]);

  if (loading) {
    return <div className="container flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!data) {
    return <div className="container">Anime not found.</div>;
  }

  return (
    <div className="watch-page container">
      <div className="mt-4 mb-4">
        <Link to={`/anime/${id}`} replace className="back-link flex items-center gap-2 text-muted mb-2">
          <ChevronLeft size={20} />
          <span>Back to {anime?.title}</span>
        </Link>
        <h1 className="text-2xl font-bold mt-2">
          Episode {currentEpisode.number}
          {currentEpisode.title && 
           currentEpisode.title.toLowerCase() !== `episode ${currentEpisode.number}` && 
           currentEpisode.title.toLowerCase() !== `${currentEpisode.number}` && 
           `: ${currentEpisode.title}`}
        </h1>
      </div>

      <div className="watch-content flex gap-6">
        <div className="player-section">
          <div className="relative-player-container" style={{ position: 'relative' }}>
            <VideoPlayer embedUrls={currentEpisode.embed_url} />
            
            {showCountdownOverlay && nextEpisode && (
              <div className="autoplay-overlay flex flex-col justify-center items-center">
                <div className="autoplay-card glass-panel flex flex-col items-center p-8">
                  <h3 className="text-lg font-bold mb-2">Up Next: Episode {nextEpisode.number}</h3>
                  <p className="text-sm text-muted mb-6">{nextEpisode.title}</p>
                  
                  {/* Circular Progress Countdown */}
                  <div className="countdown-ring-wrapper mb-6">
                    <svg className="countdown-ring" width="100" height="100">
                      <circle 
                        className="countdown-ring-bg" 
                        stroke="rgba(255, 255, 255, 0.1)" 
                        strokeWidth="6" 
                        fill="transparent" 
                        r="40" 
                        cx="50" 
                        cy="50" 
                      />
                      <circle 
                        className="countdown-ring-progress" 
                        stroke="var(--primary)" 
                        strokeWidth="6" 
                        fill="transparent" 
                        r="40" 
                        cx="50" 
                        cy="50" 
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * countdown) / 5}
                      />
                    </svg>
                    <span className="countdown-number">{countdown}</span>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        setShowCountdownOverlay(false);
                        setCountdown(5);
                        navigate(`/watch/${id}/${nextEpisode.episode_embed_id}`);
                      }}
                      className="btn-primary"
                      style={{ padding: '0.5rem 1.5rem' }}
                    >
                      Watch Now
                    </button>
                    <button 
                      onClick={() => {
                        setShowCountdownOverlay(false);
                        setCountdown(5);
                      }}
                      className="btn-secondary"
                      style={{ padding: '0.5rem 1.5rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Premium footer controls bar */}
          {nextEpisode && (
            <div className="player-footer-controls flex justify-between items-center mt-4 p-4 glass-panel">
              <div className="flex flex-col">
                <span className="text-xs text-muted uppercase tracking-wider font-bold">Up Next</span>
                <span className="text-sm font-semibold text-white">
                  Episode {nextEpisode.number}: {nextEpisode.title || 'Next Episode'}
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setCountdown(5);
                    setShowCountdownOverlay(true);
                  }}
                  className="btn-secondary autoplay-trigger flex items-center gap-2"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  ⚡ Play Next
                </button>
                <Link 
                  to={`/watch/${id}/${nextEpisode.episode_embed_id}`} 
                  className="btn-primary flex items-center gap-1"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  Skip Episode ➜
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-episodes">
            <EpisodeList 
              episodes={episodes} 
              animeId={id} 
              currentEmbedId={episode_embed_id} 
              seasons={seasons}
            />
          </div>
        </div>
      </div>

      {/* You Might Also Like Section */}
      {recommendations.length > 0 && (
        <div className="recommendations-section mt-12 mb-8">
          <h2 className="recommendations-title mb-6">You Might Also Like</h2>
          <div className="recommendations-grid">
            {recommendations.map((item) => (
              <Link to={`/anime/${item.id}`} key={item.id} className="recommendation-card-wrapper">
                <div className="recommendation-card glass-panel">
                  <div className="rec-img-wrapper">
                    <img src={item.poster} alt={item.title} className="rec-img" />
                    {item.badge && (
                      <span className={`rec-badge ${item.isRelation ? 'badge-relation' : 'badge-genre'}`}>
                        {item.badge}
                      </span>
                    )}
                    <div className="rec-overlay">
                      <span className="rec-play-btn">▶ Watch</span>
                    </div>
                  </div>
                  <div className="rec-title">{item.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
