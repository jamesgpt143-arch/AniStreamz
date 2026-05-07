import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWatchlist, removeFromWatchlist } from '../utils/storage';
import AnimeCard from '../components/AnimeCard';
import { Trash2, Heart } from 'lucide-react';
import './Watchlist.css';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    setWatchlist(getWatchlist());
  }, []);

  const handleRemove = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromWatchlist(id);
    setWatchlist(getWatchlist());
  };

  return (
    <div className="watchlist-page container py-8">
      <div className="watchlist-header flex items-center gap-3 mb-8">
        <Heart className="text-accent fill-accent" size={32} />
        <h1 className="watchlist-title">My Watchlist</h1>
      </div>

      {watchlist.length === 0 ? (
        <div className="watchlist-empty text-center py-16 glass-panel">
          <Heart className="text-muted mb-4 mx-auto opacity-30" size={64} />
          <h2 className="text-xl font-bold mb-2 text-text">Your Watchlist is Empty</h2>
          <p className="text-muted mb-6">Discover amazing anime and save them here to watch later!</p>
          <Link to="/browse" className="btn-primary">
            Explore Anime
          </Link>
        </div>
      ) : (
        <div className="anime-grid">
          {watchlist.map((anime) => (
            <div key={anime.id} className="watchlist-card-wrapper relative">
              <AnimeCard anime={anime} />
              <button 
                onClick={(e) => handleRemove(anime.id, e)}
                className="watchlist-remove-btn"
                title="Remove from Watchlist"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
