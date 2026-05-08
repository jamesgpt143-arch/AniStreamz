import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './EpisodeList.css';

export default function EpisodeList({ episodes, animeId, currentEmbedId, seasons = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRangeIdx, setActiveRangeIdx] = useState(0);
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);

  if (!episodes || episodes.length === 0) {
    return <div className="text-muted text-center py-4">No episodes available.</div>;
  }

  // Define Chunk Size (e.g. 50 episodes per chunk, or 100)
  const chunkSize = 100;
  const numChunks = Math.ceil(episodes.length / chunkSize);
  const ranges = [];

  for (let i = 0; i < numChunks; i++) {
    const startNum = i * chunkSize + 1;
    const endNum = Math.min((i + 1) * chunkSize, episodes.length);
    const startLabel = String(startNum).padStart(3, '0');
    const endLabel = String(endNum).padStart(3, '0');
    ranges.push({
      start: startNum,
      end: endNum,
      label: `${startLabel}-${endLabel}`
    });
  }

  // Automatically sync active range with the currently playing episode
  useEffect(() => {
    if (currentEmbedId) {
      const activeIdx = episodes.findIndex(ep => ep.episode_embed_id === currentEmbedId);
      if (activeIdx !== -1) {
        const activeNumber = episodes[activeIdx].number;
        const targetRangeIdx = Math.floor((activeNumber - 1) / chunkSize);
        if (targetRangeIdx >= 0 && targetRangeIdx < numChunks) {
          setActiveRangeIdx(targetRangeIdx);
        }
      }
    }
  }, [currentEmbedId, episodes, numChunks]);

  const activeRange = ranges[activeRangeIdx] || { start: 1, end: episodes.length };

  // Filter episodes by active range AND search input (number matching)
  const filteredEpisodes = episodes.filter((ep) => {
    const matchesRange = ep.number >= activeRange.start && ep.number <= activeRange.end;
    const matchesSearch = searchTerm ? String(ep.number).includes(searchTerm) : true;
    return matchesRange && matchesSearch;
  });

  return (
    <div className="episodes-container">
      {/* Episodes Header row with # Find and Badges */}
      <div className="episodes-header-row">
        <h4 className="episodes-sidebar-title">Episodes</h4>
        
        <div className="ep-controls">
          <div className="ep-search-wrapper">
            <span className="hash-symbol">#</span>
            <input 
              type="text" 
              placeholder="Find" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.replace(/\D/g, ''))} // Filter to numbers only
              className="ep-search-input"
            />
          </div>

          <div className="ep-badges-container">
            <span className="lang-badge cc-badge">CC</span>
            <span className="lang-badge mic-badge">🎤</span>
          </div>
        </div>
      </div>

      {/* Season Selection Dropdown */}
      {seasons && seasons.length > 1 && (
        <div className="ep-season-selector">
          <button 
            className="btn-season-dropdown glass-panel"
            onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
          >
            <span className="season-btn-text">
              🎬 {seasons.find(s => s.isCurrent)?.name || 'Select Season'}
            </span>
            <span className="chevron-icon">▼</span>
          </button>

          {showSeasonDropdown && (
            <div className="season-dropdown-options glass-panel">
              {seasons.map((season) => (
                <Link 
                  key={season.mal_id} 
                  to={`/watch/mal-${season.mal_id}/1`}
                  className={`season-dropdown-option ${season.isCurrent ? 'active' : ''}`}
                  onClick={() => setShowSeasonDropdown(false)}
                >
                  <span className="season-option-name">{season.name}</span>
                  <span className="season-option-badge">{season.relation}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Range Dropdown Selector (Only if episodes exceed chunkSize) */}
      {ranges.length > 1 && (
        <div className="ep-range-selector">
          <button 
            className="btn-range-dropdown glass-panel"
            onClick={() => setShowRangeDropdown(!showRangeDropdown)}
          >
            <span>{ranges[activeRangeIdx]?.label}</span>
            <span className="chevron-icon">▼</span>
          </button>

          {showRangeDropdown && (
            <div className="range-dropdown-options glass-panel">
              {ranges.map((range, idx) => (
                <div 
                  key={range.label} 
                  className={`range-dropdown-option ${activeRangeIdx === idx ? 'active' : ''}`}
                  onClick={() => {
                    setActiveRangeIdx(idx);
                    setShowRangeDropdown(false);
                  }}
                >
                  {range.label}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Squares Grid layout for episode numbers */}
      {filteredEpisodes.length > 0 ? (
        <div className="episodes-squares-grid custom-scrollbar">
          {filteredEpisodes.map((ep) => {
            const isActive = ep.episode_embed_id === currentEmbedId;
            return (
              <Link
                key={ep.id}
                to={`/watch/${animeId}/${ep.episode_embed_id}`}
                className={`ep-square-btn glass-panel ${isActive ? 'active' : ''}`}
                title={ep.title}
              >
                {ep.number}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty-episodes-state text-muted text-center py-4">No episodes found.</div>
      )}
    </div>
  );
}
