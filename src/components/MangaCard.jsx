import { Link } from 'react-router-dom';
import { Star, BookOpen } from 'lucide-react';
import './AnimeCard.css';

export default function MangaCard({ manga }) {
  return (
    <Link to={`/manga/${manga.id}`} className="anime-card animate-fade-in">
      <div className="poster-wrapper">
        <img src={manga.poster} alt={manga.title} loading="lazy" />
        <div className="poster-overlay flex flex-col justify-center items-center">
          <BookOpen size={44} className="text-accent play-icon" />
        </div>
        <div className="badges">
          {manga.rating && manga.rating !== 'N/A' && (
            <div className="badge flex items-center gap-1">
              <Star size={12} fill="gold" color="gold" />
              <span>{manga.rating}</span>
            </div>
          )}
          {manga.status && (
            <div className="badge capitalize">{manga.status}</div>
          )}
        </div>
      </div>
      <div className="card-info">
        <h3 className="title">{manga.title}</h3>
        <p className="subtitle text-muted truncate">
          {manga.author || 'Manga'}
        </p>
      </div>
    </Link>
  );
}
