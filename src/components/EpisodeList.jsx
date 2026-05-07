import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import './EpisodeList.css';

export default function EpisodeList({ episodes, animeId }) {
  if (!episodes || episodes.length === 0) {
    return <div className="text-muted">No episodes available.</div>;
  }

  return (
    <div className="episode-grid">
      {episodes.map((ep) => (
        <Link
          key={ep.id}
          to={`/watch/${animeId}/${ep.episode_embed_id}`}
          className="episode-card glass-panel flex items-center gap-4"
        >
          <div className="ep-number flex justify-center items-center">
            {ep.number}
          </div>
          <div className="ep-info">
            <h4 className="ep-title">{ep.title}</h4>
            {ep.jp_title && <p className="ep-jp text-muted">{ep.jp_title}</p>}
          </div>
          <div className="ep-play">
            <Play size={20} className="text-accent" />
          </div>
        </Link>
      ))}
    </div>
  );
}
