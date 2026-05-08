import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import AnimeDetails from './pages/AnimeDetails';
import Watch from './pages/Watch';
import Browse from './pages/Browse';
import Watchlist from './pages/Watchlist';

function App() {
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
      </div>
    </BrowserRouter>
  );
}

export default App;
