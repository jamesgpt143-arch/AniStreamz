import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SupportModal from './components/SupportModal';
import Home from './pages/Home';
import AnimeDetails from './pages/AnimeDetails';
import Watch from './pages/Watch';
import Browse from './pages/Browse';
import Watchlist from './pages/Watchlist';

function App() {
  // Load PopAds script globally for the entire site
  useEffect(() => {
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
      console.error("Failed to initialize PopAds script globally:", e);
    }
  }, []);
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ flex: '1 0 auto' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/anime/:id" element={<AnimeDetails />} />
            <Route path="/watch/:id/:episode_embed_id" element={<Watch />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/watchlist" element={<Watchlist />} />
          </Routes>
        </div>
        <Footer />
        <SupportModal />
      </div>
    </BrowserRouter>
  );
}

export default App;
