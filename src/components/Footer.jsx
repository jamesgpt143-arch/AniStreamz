import { useNavigate } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const navigate = useNavigate();
  const alphabet = '# 0-9 A B C D E F G H I J K L M N O P Q R S T U V W X Y Z'.split(' ');

  const handleLetterClick = (letter) => {
    if (letter === '#') {
      navigate('/browse?letter=hash');
    } else if (letter === '0-9') {
      navigate('/browse?letter=num');
    } else {
      navigate(`/browse?letter=${letter}`);
    }
    // Scroll window smoothly to results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer-section">
      <div className="container">
        <div className="az-list-container glass-panel p-6">
          <div className="az-header flex items-center gap-4 mb-4">
            <span className="az-title font-bold text-gradient">A-Z LIST</span>
            <span className="az-divider">|</span>
            <span className="az-subtitle text-muted">Searching order by alphabet name A to Z.</span>
          </div>
          <div className="az-buttons">
            {alphabet.map((letter) => (
              <button
                key={letter}
                onClick={() => handleLetterClick(letter)}
                className="az-btn"
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
        <div className="footer-disclaimer text-center mt-6 text-muted">
          <p>
            This site <span className="logo-text font-bold text-gradient">AniStreamz</span> does not store any files on its server. 
            All contents are provided by non-affiliated third parties.
          </p>
          <p className="mt-2 text-xs">© 2026 AniStreamz. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
