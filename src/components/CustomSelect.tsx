import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  sublabel?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[] | string[];
  label?: React.ReactNode;
  isRequired?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
  hasError?: boolean;
  errorMessage?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const CustomSelect: React.FC<CustomSelectProps> = React.memo(({
  value,
  onChange,
  options,
  label,
  isRequired = false,
  placeholder = 'Select an option',
  icon,
  hasError = false,
  errorMessage,
  className = '',
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to SelectOption format
  const normalizedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: string, isDisabled?: boolean) => {
    if (isDisabled) return;
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-[#1A1A2E] mb-1.5 flex items-center gap-1">
          <span>{label}</span>
          {isRequired && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left transition-all flex items-center justify-between gap-2.5 bg-[#FAFAF7] cursor-pointer group ${
          size === 'sm'
            ? 'min-h-[38px] px-3 py-1.5 rounded-xl text-xs border'
            : 'min-h-[48px] px-4 py-2.5 rounded-2xl text-xs sm:text-sm border-2'
        } ${
          isOpen
            ? 'border-[#1A1A2E] bg-white shadow-[3px_3px_0px_#1A1A2E] ring-2 ring-[#C9B8F0]/40'
            : hasError
            ? 'border-red-400 bg-[#FFF5F5]'
            : 'border-[#E8E4F0] hover:border-[#1A1A2E] hover:bg-white hover:shadow-[2px_2px_0px_#1A1A2E]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && (
            <span className="text-[#6B46C1] shrink-0">
              {icon}
            </span>
          )}

          <div className="min-w-0 flex-1">
            {selectedOption ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[#1A1A2E] truncate">
                  {selectedOption.label}
                </span>
                {selectedOption.badge && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#EDE8FC] text-[#553C9A]">
                    {selectedOption.badge}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[#6B6B8A] font-medium">
                {placeholder}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center">
          <ChevronDown
            className={`w-4 h-4 text-[#6B6B8A] transition-transform duration-200 group-hover:text-[#1A1A2E] ${
              isOpen ? 'rotate-180 text-[#1A1A2E]' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-full max-h-64 overflow-y-auto bg-white rounded-2xl border-2 border-[#1A1A2E] shadow-[6px_6px_0px_0px_#1A1A2E] p-1.5 animate-fadeIn">
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            const isDisabled = !!opt.disabled;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={isDisabled}
                onClick={() => handleSelect(opt.value, isDisabled)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between gap-2 ${
                  isDisabled
                    ? 'opacity-65 bg-[#FAFAF7] text-[#6B6B8A] cursor-not-allowed border border-dashed border-[#E8E4F0] my-0.5'
                    : isSelected
                    ? 'bg-[#EDE8FC] text-[#1A1A2E] font-black cursor-pointer'
                    : 'text-[#1A1A2E] hover:bg-[#FAFAF7] hover:text-[#6B46C1] cursor-pointer'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`truncate ${isDisabled ? 'text-[#6B6B8A]' : ''}`}>{opt.label}</span>
                    {opt.badge && (
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        isDisabled
                          ? 'bg-[#FEF0E7] text-[#C05621] border border-[#F5C6A8]'
                          : 'bg-white text-[#553C9A] border border-[#C9B8F0]'
                      }`}>
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  {opt.sublabel && (
                    <div className="text-[11px] text-[#6B6B8A] font-normal mt-0.5 truncate">
                      {opt.sublabel}
                    </div>
                  )}
                </div>

                {isSelected && !isDisabled && (
                  <Check className="w-4 h-4 text-[#6B46C1] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {hasError && errorMessage && (
        <p className="mt-1 text-xs text-red-600 font-semibold flex items-center gap-1">
          <span>⚠️</span> {errorMessage}
        </p>
      )}
    </div>
  );
});
