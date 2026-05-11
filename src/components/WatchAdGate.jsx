import { useState, useEffect } from 'react';
import './WatchAdGate.css';

const UNLOCK_DURATION_MS = 60 * 60 * 1000; // Unlock for 1 hour (3600000ms)

export default function WatchAdGate({ children }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10); // 10-second countdown

  // 1. Check if already unlocked in localStorage on mount & when it changes
  useEffect(() => {
    const checkUnlockStatus = () => {
      const unlockedUntil = localStorage.getItem('anistreamz_unlocked_until');
      if (unlockedUntil) {
        const expiryTime = parseInt(unlockedUntil, 10);
        if (Date.now() < expiryTime) {
          setIsUnlocked(true);
          return;
        }
      }
      setIsUnlocked(false);
    };

    checkUnlockStatus();
    // Check every 5 seconds to automatically relock if time expires
    const interval = setInterval(checkUnlockStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // 2. Load the PopAds script dynamically on mount
  useEffect(() => {
    if (isUnlocked) return;
    // Only load if not already loaded
    const u = "d8e6b698644c0b7953cf2be1c5ff36c9";
    if (window[u]) return;

    try {
      var k = window,
          g = [
            ["siteId", 747 - 27 - 138 + 666 + 5297643], // siteId = 5298144
            ["minBid", 0],
            ["popundersPerIP", "0"],
            ["delayBetween", 0],
            ["default", false],
            ["defaultPerDay", 0],
            ["topmostLayer", "auto"]
          ],
          n = [
            "d3d3LnZpc2FyaW9tZWRpYS5jb20vYmNvbG9ycy5taW4uY3Nz", // www.visariomedia.com/bcolors.min.css
            "ZDEzazdwcmF4MXlpMDQuY2xvdWRmcm9udC5uZXQvVXdJVW4vY2J3aXAtanMtbWluLmpz" // d13k7prax1yi04.cloudfront.net/UwIUn/cbwip-js-min.js
          ],
          h = -1,
          j,
          b,
          t = function () {
            clearTimeout(b);
            h++;
            if (n[h] && !(1804380408000 < (new Date).getTime() && 1 < h)) {
              j = k.document.createElement("script");
              j.type = "text/javascript";
              j.async = !0;
              var d = k.document.getElementsByTagName("script")[0];
              j.src = "https://" + atob(n[h]);
              j.crossOrigin = "anonymous";
              j.onerror = t;
              j.onload = function () {
                clearTimeout(b);
                k[u.slice(0, 16) + u.slice(0, 16)] || t();
              };
              b = setTimeout(t, 5000);
              if (d && d.parentNode) {
                d.parentNode.insertBefore(j, d);
              } else {
                k.document.head.appendChild(j);
              }
            }
          };

      Object.freeze(k[u] = g);
      t();
    } catch (e) {
      console.error("Failed to initialize PopAds script:", e);
    }
  }, [isUnlocked]);

  // 3. Countdown timer logic
  useEffect(() => {
    let timer;
    if (isWatching && secondsLeft > 0) {
      timer = setTimeout(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isWatching && secondsLeft === 0) {
      // 4. Save unlock state and timestamp to localStorage
      const expiry = Date.now() + UNLOCK_DURATION_MS;
      localStorage.setItem('anistreamz_unlocked_until', expiry.toString());
      setIsUnlocked(true);
      setIsWatching(false);
      
      // Reload page immediately to purge PopAds memory and global click listeners
      window.location.reload();
    }
    return () => clearTimeout(timer);
  }, [isWatching, secondsLeft]);

  const handleStartUnlock = () => {
    setIsWatching(true);
    setSecondsLeft(10);

    // Dynamic PopAds trigger fallback if global trigger exists
    if (window.popads_trigger) {
      try {
        window.popads_trigger();
      } catch (err) {
        console.warn("PopAds manual trigger error:", err);
      }
    }
  };

  // If unlocked, render the original children (the VideoPlayer)
  if (isUnlocked) {
    return children;
  }

  // Calculate percentage for progress bar
  const progressPercent = ((10 - secondsLeft) / 10) * 100;

  return (
    <div className="ad-gate-wrapper glass-panel">
      <div className="ad-gate-background"></div>
      
      <div className="ad-gate-card glass-panel">
        <div className={`ad-gate-icon-container ${!isWatching ? 'pulse-active' : ''}`}>
          {!isWatching && <div className="ad-gate-glow-dot"></div>}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            style={{ width: '32px', height: '32px' }}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
            />
          </svg>
        </div>

        <h3 className="ad-gate-title">Unlock Episode Player</h3>
        <p className="ad-gate-desc">
          We use ads to keep AniStreamz free! Click the button below to trigger the sponsor link and unlock streaming instantly.
        </p>

        {!isWatching ? (
          <button 
            onClick={handleStartUnlock}
            className="ad-gate-btn"
          >
            <span>🔓 Unlock Player (Watch Ad)</span>
          </button>
        ) : (
          <div className="ad-gate-loader">
            <div className="ad-gate-loader-text">
              <span>Contacting sponsor network...</span>
              <span>{secondsLeft}s left</span>
            </div>
            <div className="ad-gate-loader-bar-bg">
              <div 
                className="ad-gate-loader-bar-fill" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}

        <p className="ad-gate-footer-note">
          *Ad will open in a new background tab. You can safely close it once the countdown is complete. Access lasts for 1 hour.
        </p>
      </div>
    </div>
  );
}
