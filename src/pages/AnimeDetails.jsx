import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ChevronLeft } from 'lucide-react';
import EpisodeList from '../components/EpisodeList';
import TrailerModal from '../components/TrailerModal';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../utils/storage';
import './AnimeDetails.css';

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

export default function AnimeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  useEffect(() => {
    if (data?.anime) {
      setIsFavorite(isInWatchlist(data.anime.id));
    }
  }, [data]);

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
                : null,
              trailer_url: item.trailer?.embed_url
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
            setData({ anime: animeObj, episodes: epsObj });
          }
        } else {
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

  if (loading) {
    return <div className="container flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!data) {
    return <div className="container">Anime not found.</div>;
  }

  const { anime, episodes } = data;

  const toggleWatchlist = () => {
    if (isFavorite) {
      removeFromWatchlist(anime.id);
      setIsFavorite(false);
    } else {
      addToWatchlist(anime);
      setIsFavorite(true);
    }
  };

  return (
    <div className="anime-details-page">
      <div 
        className="banner" 
        style={{ backgroundImage: `url(${anime.background_image || anime.poster})` }}
      >
        <div className="banner-overlay"></div>
      </div>

      <div className="container content-wrapper">
        <button className="back-button-details" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
          <span>Back</span>
        </button>
        <div className="info-header flex gap-6">
          <div className="poster">
            <img src={anime.poster} alt={anime.title} />
          </div>
          <div className="details flex-col">
            <h1 className="title">{anime.title}</h1>
            {anime.alternative && <h2 className="alternative-title text-muted">{anime.alternative}</h2>}
            
            <div className="meta flex items-center gap-4 mt-2">
              <span className="badge-rating">{anime.rating}</span>
              {anime.score && (
                <div className="flex items-center gap-1 text-accent font-bold">
                  <Star size={16} fill="currentColor" /> {anime.score}
                </div>
              )}
              <span className="text-muted">{anime.year}</span>
              <span className="text-muted">{anime.status}</span>
            </div>

            {anime.next_episode_schedule && (
              <div className="schedule-badge mt-2">
                {anime.next_episode_schedule}
              </div>
            )}

            <p className="description mt-4">{anime.description}</p>
            
            <div className="genres flex gap-2 mt-4">
              {anime.terms_by_type?.genre?.map((g) => (
                <span key={g} className="genre-tag">{g}</span>
              ))}
            </div>

            <div className="details-actions flex gap-4 mt-6 flex-wrap">
              {episodes.length > 0 && (
                <Link to={`/watch/${id}/${episodes[0].episode_embed_id}`} className="btn-primary">
                  Watch Episode 1
                </Link>
              )}
              {anime.trailer_url && (
                <button onClick={() => setIsTrailerOpen(true)} className="btn-secondary">
                  Watch Trailer
                </button>
              )}
              <button 
                onClick={toggleWatchlist} 
                className={`btn-secondary btn-fav ${isFavorite ? 'favorite' : ''}`}
              >
                {isFavorite ? '❤️ In Watchlist' : '⭐ Add to Watchlist'}
              </button>
            </div>
          </div>
        </div>

        <div className="episodes-section mt-8">
          <h2 className="section-title mb-4">Episodes</h2>
          <EpisodeList episodes={episodes} animeId={id} />
        </div>
      </div>
      <TrailerModal 
        isOpen={isTrailerOpen} 
        onClose={() => setIsTrailerOpen(false)} 
        trailerUrl={anime.trailer_url} 
      />
    </div>
  );
}
