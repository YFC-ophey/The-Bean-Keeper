import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Play, Coffee, Loader2 } from 'lucide-react';

interface FloatingWelcomeTooltipProps {
  className?: string;
}

const DEMO_VIDEO_URL = 'https://res.cloudinary.com/dog6jqdmz/video/upload/v1769561616/bean-keeper-demo-v1_mgiyst.mp4';
const STORAGE_KEY = 'beanito_tooltip_dismissed';

export default function FloatingWelcomeTooltip({ className = '' }: FloatingWelcomeTooltipProps) {
  const { t } = useTranslation(['common']);
  const [isVisible, setIsVisible] = useState(false);
  const [isTooltipDismissed, setIsTooltipDismissed] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [modalAnimating, setModalAnimating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed === 'true') {
      setIsTooltipDismissed(true);
    }
  }, []);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const shouldShow = scrollY > 100;

      if (shouldShow && !isVisible) {
        setIsVisible(true);
        // Trigger animation after becoming visible
        setTimeout(() => setHasAnimated(true), 100);
      } else if (!shouldShow && isVisible) {
        setIsVisible(false);
        setHasAnimated(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial scroll position
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible]);

  const handleWatchClick = () => {
    setIsVideoLoading(true);
    setShowVideoModal(true);
    setModalAnimating(true);
    setIsTooltipDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    // Allow animation to complete
    setTimeout(() => setModalAnimating(false), 300);
  };

  const handleCloseVideo = () => {
    setModalAnimating(true);
    setTimeout(() => {
      setShowVideoModal(false);
      setModalAnimating(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }, 200);
  };

  const handleVideoLoaded = () => {
    setIsVideoLoading(false);
  };

  const handleDismiss = () => {
    setIsTooltipDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-[20%] left-4 sm:left-12 z-40 flex flex-col items-start sm:items-center max-w-[calc(100vw-2rem)] sm:max-w-sm ${className}`}
    >
      {/* Tooltip Speech Bubble */}
      {!isTooltipDismissed && (
        <div
          className={`relative mb-4 transform transition-all duration-500 ${
            hasAnimated
              ? 'translate-y-0 opacity-85'
              : 'translate-y-4 opacity-0'
          }`}
        >
          {/* Speech bubble - 20% smaller text */}
          <div className="relative bg-gradient-to-br from-[#6F4E37] to-[#8B6F47] rounded-xl shadow-xl p-4 pr-9">
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute top-1 right-1.5 w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              aria-label={t('common:ui.close')}
            >
              <X className="w-3 h-3 text-white" />
            </button>

            {/* Welcome text - reduced from text-sm to text-xs */}
            <p className="text-white/90 text-xs mb-2 font-medium leading-relaxed max-w-[200px]">
              {t('common:beanito.welcome')}
            </p>

            {/* Watch Here button - reduced sizes */}
            <button
              onClick={handleWatchClick}
              className="group flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-all duration-300 hover:scale-200"
            >
              <Play className="w-3 h-3 text-white fill-white" />
              <span className="text-white font-semibold text-xs">
                {t('common:beanito.watchHere')}
              </span>
            </button>

            {/* Speech bubble arrow pointing down to Beanito */}
            <div className="absolute -bottom-2 left-6 w-0 h-0 border-l-6 border-l-transparent border-r-6 border-r-transparent border-t-8 border-t-[#8B6F47]" />
          </div>
        </div>
      )}

      {/* Beanito Mascot */}
      <div
        className={`transform transition-all duration-700 ease-out ${
          hasAnimated
            ? 'translate-x-0 opacity-100'
            : '-translate-x-full opacity-0'
        }`}
      >
        <div
          className="relative cursor-pointer group"
          onClick={() => {
            if (isTooltipDismissed) {
              // Re-show tooltip when clicking Beanito
              setIsTooltipDismissed(false);
              localStorage.removeItem(STORAGE_KEY);
            }
          }}
        >
          {/* Beanito image */}
          <img
            src="/beanito/pointing.png"
            alt="Beanito mascot"
            className="w-24 h-auto sm:w-32 drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
            style={{
              animation: 'beanito-float 5s ease-in-out infinite',
            }}
          />

          {/* Glow effect on hover */}
          <div className="absolute inset-0 rounded-full bg-[#6F4E37]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
        </div>
      </div>

      {/* Keyframes for floating animation */}
      <style>{`
        @keyframes beanito-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>

      {/* Video Modal - Mobile Optimized */}
      {showVideoModal && (
        <div
          className={`fixed inset-0 z-[200] flex flex-col bg-[#1a0f0a] transition-opacity duration-300 ${
            modalAnimating ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 sm:py-4 bg-gradient-to-b from-[#2C1810] to-transparent">
            <div className="flex items-center gap-3">
              <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-[#C4A57B]" />
              <div>
                <h2 className="text-white font-serif font-semibold text-sm sm:text-lg">
                  The Bean Keeper Demo
                </h2>
                <p className="text-white/60 text-xs sm:text-sm">
                  80 seconds to coffee tracking mastery
                </p>
              </div>
            </div>
            <button
              onClick={handleCloseVideo}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center transition-colors"
              aria-label={t('common:ui.close')}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </div>

          {/* Video Container - Centered */}
          <div className="flex-1 flex items-center justify-center px-2 sm:px-8 py-4">
            <div className="relative w-full max-w-4xl">
              {/* Loading State */}
              {isVideoLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#2C1810] rounded-xl sm:rounded-2xl z-10">
                  <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-[#C4A57B] animate-spin mb-3" />
                  <p className="text-white/70 text-sm font-medium">Loading demo...</p>
                </div>
              )}

              {/* Video */}
              <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl bg-black">
                <video
                  ref={videoRef}
                  src={DEMO_VIDEO_URL}
                  className="w-full h-auto max-h-[70vh] object-contain"
                  controls
                  autoPlay
                  playsInline
                  onLoadedData={handleVideoLoaded}
                  onCanPlay={handleVideoLoaded}
                  controlsList="nodownload"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>

          {/* Footer hint */}
          <div className="px-4 py-3 sm:py-4 text-center">
            <p className="text-white/40 text-xs sm:text-sm">
              Tap anywhere outside or press X to close
            </p>
          </div>

          {/* Background tap to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={handleCloseVideo}
          />
        </div>
      )}
    </div>
  );
}
