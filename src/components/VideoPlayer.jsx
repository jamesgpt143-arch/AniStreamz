import { useState } from 'react';
import './VideoPlayer.css';

export default function VideoPlayer({ embedUrls }) {
  const [audio, setAudio] = useState('sub');
  const [autoplay, setAutoplay] = useState(() => {
    return localStorage.getItem('anistreamz_autoplay') !== 'false';
  });

  const toggleAutoplay = () => {
    const newVal = !autoplay;
    setAutoplay(newVal);
    localStorage.setItem('anistreamz_autoplay', String(newVal));
  };

  if (!embedUrls) return null;

  const hasDub = !!embedUrls.dub;
  const currentUrl = audio === 'sub' ? embedUrls.sub : embedUrls.dub;

  return (
    <div className="video-player-container">
      <div className="player-controls flex items-center justify-between glass-panel p-4 mb-4">
        <h3 className="text-xl font-bold">Now Playing</h3>
        
        <div className="player-control-options flex items-center gap-4">
          {/* Autoplay Toggle switch */}
          <div className="autoplay-toggle flex items-center gap-2">
            <span className="text-sm text-muted" style={{ fontSize: '0.875rem' }}>Autoplay</span>
            <button
              className={`btn-toggle btn-autoplay ${autoplay ? 'active' : ''}`}
              onClick={toggleAutoplay}
              style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}
              title="Toggle autoplay next episode"
            >
              {autoplay ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="audio-toggles flex gap-2">
            <button
              className={`btn-toggle ${audio === 'sub' ? 'active' : ''}`}
              onClick={() => setAudio('sub')}
              style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}
            >
              Sub
            </button>
            {hasDub && (
              <button
                className={`btn-toggle ${audio === 'dub' ? 'active' : ''}`}
                onClick={() => setAudio('dub')}
                style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}
              >
                Dub
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="iframe-wrapper glass-panel">
        <iframe
          key={currentUrl}
          src={currentUrl}
          allowFullScreen
          allow="autoplay; fullscreen"
          title="Video Player"
          className="video-iframe"
        ></iframe>
      </div>
    </div>
  );
}
