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
    <div className="pt-1">
      {/* Micro-header with title, badge and scroll controls */}
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Clock className="w-3.5 h-3.5 text-[#553C9A] shrink-0" />
          <span className="text-xs font-black text-[#1A1A2E] shrink-0">
            {label}
          </span>
          {!earliestBadge && (
            <span className="text-[10px] font-bold text-[#6B6B8A] truncate">
              ({hours.length} available)
            </span>
          )}
          {earliestBadge && (
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FEF0E7] text-[#C05621] border border-[#F5C6A8] shrink-0">
              {earliestBadge}
            </span>
          )}
        </div>

        {isScrollable && (
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            <button
              type="button"
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className="w-6 h-6 rounded-lg bg-white border border-[#E8E4F0] hover:border-[#1A1A2E] hover:bg-[#EDE8FC] flex items-center justify-center text-[#1A1A2E] shadow-2xs hover:shadow-[2px_2px_0px_#1A1A2E] disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer active:translate-y-0.5"
              aria-label="Scroll earlier hours"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              disabled={!canScrollRight}
              className="w-6 h-6 rounded-lg bg-white border border-[#E8E4F0] hover:border-[#1A1A2E] hover:bg-[#EDE8FC] flex items-center justify-center text-[#1A1A2E] shadow-2xs hover:shadow-[2px_2px_0px_#1A1A2E] disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer active:translate-y-0.5"
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
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10 rounded-l-xl" />
        )}
        {isScrollable && canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10 rounded-r-xl" />
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-center gap-2 overflow-x-auto py-1 px-1 scrollbar-none scroll-smooth"
        >
          {hours.map((hour) => {
            const isSelected = value === hour.value;
            return (
              <button
                key={hour.value}
                type="button"
                data-value={hour.value}
                onClick={() => onChange(hour.value)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#C9B8F0] text-[#1A1A2E] border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] -translate-y-0.5 z-10'
                    : 'bg-[#FAFAF7] border-2 border-[#E8E4F0] hover:border-[#1A1A2E] hover:bg-[#EDE8FC] text-[#1A1A2E] shadow-2xs hover:shadow-[2px_2px_0px_#1A1A2E] hover:-translate-y-0.5 active:translate-y-0'
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
