import { Link } from 'react-router-dom';
import { Star, PlayCircle } from 'lucide-react';
import './AnimeCard.css';

export default function AnimeCard({ anime }) {
  return (
    <Link to={`/anime/${anime.id}`} className="anime-card">
      <div className="poster-wrapper">
        <img src={anime.poster} alt={anime.title} loading="lazy" />
        <div className="poster-overlay flex-col justify-center items-center">
          <PlayCircle size={48} className="text-accent play-icon" />
        </div>
        <div className="badges">
          {anime.score && (
            <div className="badge flex items-center gap-1">
              <Star size={12} fill="gold" color="gold" />
              <span>{anime.score}</span>
            </div>
          )}
          {anime.status && <div className="badge">{anime.status}</div>}
        </div>
      </div>
      <div className="card-info">
        <h3 className="title">{anime.title}</h3>
        <p className="subtitle text-muted flex items-center gap-2">
          {anime.year || 'N/A'} • {anime.type?.[0] || 'TV'}
        </p>
      </div>
    </Link>
  );
}
