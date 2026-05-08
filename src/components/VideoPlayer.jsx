import { useState } from 'react';
import './VideoPlayer.css';

export default function VideoPlayer({ embedUrls }) {
  const [audio, setAudio] = useState('sub');

  if (!embedUrls) return null;

  const hasDub = !!embedUrls.dub;
  const currentUrl = audio === 'sub' ? embedUrls.sub : embedUrls.dub;

  return (
    <div className="video-player-container">
      <div className="player-controls flex items-center justify-between glass-panel p-4 mb-4">
        <h3 className="text-xl font-bold">Now Playing</h3>
        <div className="audio-toggles flex gap-2">
          <button
            className={`btn-toggle ${audio === 'sub' ? 'active' : ''}`}
            onClick={() => setAudio('sub')}
          >
            Sub
          </button>
          {hasDub && (
            <button
              className={`btn-toggle ${audio === 'dub' ? 'active' : ''}`}
              onClick={() => setAudio('dub')}
            >
              Dub
            </button>
          )}
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
