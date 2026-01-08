import { useState, useEffect, useRef } from "react";

export default function ScrollSidebar() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const lastUpdateTime = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();
      // Throttle to 100ms intervals
      if (now - lastUpdateTime.current < 100) return;

      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const maxScroll = documentHeight - windowHeight;
      const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

      // Round to nearest 1% to reduce unnecessary updates
      const roundedProgress = Math.round(progress);
      if (Math.abs(roundedProgress - scrollProgress) >= 1) {
        setScrollProgress(roundedProgress);
      }

      // Only update visibility when crossing threshold
      const shouldBeVisible = scrollTop > 100;
      if (shouldBeVisible !== isVisible) {
        setIsVisible(shouldBeVisible);
      }

      lastUpdateTime.current = now;
    };

    handleScroll(); // Initial call
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollProgress, isVisible]);

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const clickPercent = clickY / rect.height;

    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const maxScroll = documentHeight - windowHeight;
    const targetScroll = maxScroll * clickPercent;

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
  };

  return (
    <div
      className={`fixed right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Scroll Track */}
      <div
        onClick={handleBarClick}
        className="relative w-2 h-48 md:h-64 lg:h-80 cursor-pointer group"
      >
        {/* Background Track - Coffee Cream */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#E8DCC8]/40 to-[#D4C5B0]/40 backdrop-blur-sm border border-[#D4C5B0]/30 shadow-sm" />

        {/* Progress Fill - Coffee Brown Pour */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t from-[#6F4E37] via-[#8B6F47] to-[#6F4E37]/80 shadow-md transition-all duration-300 ease-out"
          style={{ height: `${scrollProgress}%` }}
        >
          {/* Shimmer effect on top of progress */}
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-white/20 to-transparent rounded-t-full" />
        </div>

        {/* Coffee Bean Markers - appear at 25%, 50%, 75% */}
        {[25, 50, 75].map((percent) => (
          <div
            key={percent}
            className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{
              top: `${percent}%`,
              backgroundColor: scrollProgress >= percent ? '#FFFFFF' : '#6F4E37',
              opacity: scrollProgress >= percent ? 1 : 0.4,
              transform: scrollProgress >= percent
                ? 'translateX(-50%) scale(1.3)'
                : 'translateX(-50%) scale(1)',
            }}
          />
        ))}

        {/* Hover Tooltip */}
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-[#6F4E37] text-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium whitespace-nowrap">
            {Math.round(scrollProgress)}% through collection
          </div>
          {/* Arrow */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-px">
            <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-[#6F4E37]" />
          </div>
        </div>

        {/* Scroll Down Hint (when at top) */}
        {scrollProgress < 5 && isVisible && (
          <div className="absolute -right-6 -bottom-8 text-[10px] text-[#8B6F47]/60 font-medium animate-pulse">
            ↓
          </div>
        )}
      </div>
    </div>
  );
}
