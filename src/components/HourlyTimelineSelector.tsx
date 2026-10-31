import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export interface HourlySlotItem {
  value: string;
  label: string;
  shortLabel: string;
  h: number;
}

interface HourlyTimelineSelectorProps {
  value: string;
  onChange: (val: string) => void;
  hours: HourlySlotItem[];
  label?: string;
  earliestBadge?: string;
}

export const HourlyTimelineSelector: React.FC<HourlyTimelineSelectorProps> = React.memo(({
  value,
  onChange,
  hours,
  label = 'Select Hour',
  earliestBadge,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasScroll = el.scrollWidth > el.clientWidth + 2;
    setIsScrollable(hasScroll);
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(() => checkScroll());
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [checkScroll, hours]);

  // Auto-scroll selected hour into view when value changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const selectedBtn = el.querySelector<HTMLElement>(`[data-value="${value}"]`);
    if (selectedBtn) {
      selectedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    // Re-check scroll buttons after scrolling
    const t = setTimeout(checkScroll, 300);
    return () => clearTimeout(t);
  }, [value, checkScroll]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -140, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 140, behavior: 'smooth' });
    }
  };

  return (
    <div className="pt-0.5">
      {/* Micro-header with title, badge and scroll controls */}
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Clock className="w-3 h-3 text-[#6B6B8A] shrink-0" />
          <span className="text-[11px] font-bold text-[#6B6B8A] truncate">
            {label}
          </span>
          <span className="text-[10px] font-semibold text-[#A0AEC0]">
            ({hours.length} available)
          </span>
          {earliestBadge && (
            <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] shrink-0">
              {earliestBadge}
            </span>
          )}
        </div>

        {isScrollable && (
          <div className="flex items-center gap-1 shrink-0 ml-1">
            <button
              type="button"
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className="w-5 h-5 rounded-md flex items-center justify-center text-[#6B6B8A] hover:text-[#1A1A2E] hover:bg-[#EDE8FC] disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
              aria-label="Scroll earlier hours"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              disabled={!canScrollRight}
              className="w-5 h-5 rounded-md flex items-center justify-center text-[#6B6B8A] hover:text-[#1A1A2E] hover:bg-[#EDE8FC] disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
              aria-label="Scroll later hours"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Pill strip with gradient edge masks when overflowing */}
      <div className="relative">
        {isScrollable && canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10 rounded-l-lg" />
        )}
        {isScrollable && canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10 rounded-r-lg" />
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 scrollbar-none scroll-smooth"
        >
          {hours.map((hour) => {
            const isSelected = value === hour.value;
            return (
              <button
                key={hour.value}
                type="button"
                data-value={hour.value}
                onClick={() => onChange(hour.value)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#1A1A2E] text-white shadow-xs scale-[1.02] ring-2 ring-[#1A1A2E]/20'
                    : 'bg-[#FAFAF7] border border-[#E8E4F0] text-[#1A1A2E] hover:bg-[#EDE8FC] hover:border-[#C9B8F0]'
                }`}
              >
                {hour.shortLabel}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
