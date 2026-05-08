import { useState, useEffect } from 'react';
import { X, Copy, Heart, Coffee, Check } from 'lucide-react';
import './SupportModal.css';

export default function SupportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('gcash');
  const [copied, setCopied] = useState(false);

  const gcashNumber = '09310799262';
  const kofiUrl = 'https://ko-fi.com/james17582';

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      document.body.style.overflow = 'hidden'; // Lock background scrolling
    };
    
    window.addEventListener('open-support-modal', handleOpen);
    return () => {
      window.removeEventListener('open-support-modal', handleOpen);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    document.body.style.overflow = 'auto'; // Restore background scrolling
  };

  const handleCopyGcash = async () => {
    try {
      await navigator.clipboard.writeText(gcashNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="support-modal-overlay" onClick={handleClose}>
      <div 
        className="support-modal-card glass-panel" 
        onClick={(e) => e.stopPropagation()} // Prevent close on clicking modal card
      >
        <button className="support-close-btn" onClick={handleClose} aria-label="Close Modal">
          <X size={20} />
        </button>

        <div className="support-header text-center">
          <div className="heart-pulse-icon">
            <Heart size={32} fill="var(--primary)" className="text-accent" />
          </div>
          <h2 className="support-title text-gradient">Support AniStreamz</h2>
          <p className="support-subtitle">
            Help keep our streaming servers active and maintain a 100% ad-free experience for everyone!
          </p>
        </div>

        {/* Tab Selection */}
        <div className="support-tabs">
          <button 
            className={`support-tab ${activeTab === 'gcash' ? 'active' : ''}`}
            onClick={() => setActiveTab('gcash')}
          >
            📱 GCash
          </button>
          <button 
            className={`support-tab ${activeTab === 'kofi' ? 'active' : ''}`}
            onClick={() => setActiveTab('kofi')}
          >
            <Coffee size={16} className="tab-coffee-icon" /> Ko-fi
          </button>
        </div>

        {/* Tab Content */}
        <div className="support-tab-content">
          {activeTab === 'gcash' ? (
            <div className="gcash-content text-center">
              <div className="gcash-logo-wrapper mb-4">
                <span className="gcash-logo-text">G) GCash</span>
              </div>
              
              <div className="gcash-details glass-panel p-4 mb-4">
                <span className="details-label">GCash Number</span>
                <div className="number-row flex justify-between items-center mt-1">
                  <span className="gcash-number">{gcashNumber}</span>
                  <button 
                    onClick={handleCopyGcash} 
                    className={`copy-btn flex items-center gap-1 ${copied ? 'copied' : ''}`}
                    title="Copy GCash Number"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="gcash-name mt-3 text-sm text-muted">
                  Account Name: <strong className="text-white">J** S.</strong>
                </div>
              </div>

              <div className="qr-placeholder glass-panel p-4 flex flex-col items-center">
                <span className="text-xs text-muted mb-2">Scan QR Code to Pay</span>
                <div className="qr-box flex items-center justify-center">
                  {/* High quality scan mock */}
                  <svg className="qr-svg" viewBox="0 0 100 100" width="120" height="120">
                    <rect width="100" height="100" fill="transparent" />
                    <path d="M5,5 h20 v5 h-15 v15 h-5 z" fill="var(--primary)" />
                    <path d="M95,5 h-20 v5 h15 v15 h5 z" fill="var(--primary)" />
                    <path d="M5,95 h20 v-5 h-15 v-15 h-5 z" fill="var(--primary)" />
                    <path d="M95,95 h-20 v-5 h15 v-15 h5 z" fill="var(--primary)" />
                    <rect x="15" y="15" width="20" height="20" fill="none" stroke="white" strokeWidth="4" />
                    <rect x="21" y="21" width="8" height="8" fill="var(--primary)" />
                    <rect x="65" y="15" width="20" height="20" fill="none" stroke="white" strokeWidth="4" />
                    <rect x="71" y="21" width="8" height="8" fill="var(--primary)" />
                    <rect x="15" y="65" width="20" height="20" fill="none" stroke="white" strokeWidth="4" />
                    <rect x="21" y="71" width="8" height="8" fill="var(--primary)" />
                    <rect x="50" y="45" width="10" height="10" fill="white" />
                    <rect x="65" y="65" width="10" height="10" fill="white" />
                    <rect x="80" y="80" width="10" height="10" fill="white" />
                    <rect x="45" y="75" width="10" height="10" fill="white" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="kofi-content text-center">
              <div className="kofi-icon-wrapper mb-4">
                <div className="coffee-cup-anim">☕</div>
              </div>
              <p className="kofi-desc mb-6 text-muted">
                If you prefer international payments or donating via debit/credit card, you can support us directly on Ko-fi!
              </p>
              <a 
                href={kofiUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="kofi-link-btn flex items-center justify-center gap-2"
              >
                <Coffee size={18} />
                <span>Support on Ko-fi</span>
              </a>
            </div>
          )}
        </div>

        <div className="support-footer text-center mt-6 text-xs text-muted">
          Your support helps us pay for fast video scrapers and unlimited bandwidth. Thank you so much!
        </div>
      </div>
    </div>
  );
}
