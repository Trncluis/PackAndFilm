import React, { useState, useMemo } from 'react';
import {
  FileText,
  ShieldAlert,
  Clock,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Printer,
  Search,
  CheckCircle2,
  Home,
  Camera,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { TERMS_AND_CONDITIONS_DATA, RENTAL_CONFIG } from '../data/rentalConfig';

interface DedicatedTermsPageProps {
  onNavigate: (view: 'home' | 'book' | 'requirements' | 'terms' | 'admin', options?: { camera?: string; date?: string; scrollTo?: string }) => void;
}

export const DedicatedTermsPage: React.FC<DedicatedTermsPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClauses, setExpandedClauses] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7]); // All open by default for readability

  const toggleClause = (index: number) => {
    setExpandedClauses(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const expandAll = () => setExpandedClauses([0, 1, 2, 3, 4, 5, 6, 7]);
  const collapseAll = () => setExpandedClauses([]);

  const filteredClauses = useMemo(() => {
    if (!searchQuery.trim()) return TERMS_AND_CONDITIONS_DATA;
    const query = searchQuery.toLowerCase();
    return TERMS_AND_CONDITIONS_DATA.filter(
      clause =>
        clause.title.toLowerCase().includes(query) ||
        (clause.content && clause.content.some(item => item.toLowerCase().includes(query)))
    );
  }, [searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1A1A2E] flex flex-col font-sans selection:bg-[#C9B8F0] selection:text-[#1A1A2E]">
      {/* Top Header / Breadcrumbs */}
      <header className="sticky top-0 z-40 bg-[#FAFAF7]/95 backdrop-blur-md border-b-2 border-[#1A1A2E] px-4 sm:px-8 py-3.5 transition-all print:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-[#1A1A2E] bg-white hover:bg-[#EDE8FC] text-xs font-black shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
            <span className="text-[#6B6B8A] text-xs font-bold hidden sm:inline">/</span>
            <span className="text-xs font-black text-[#553C9A] bg-[#EDE8FC] px-2.5 py-1 rounded-lg border border-[#C9B8F0] hidden sm:inline-flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[#6B46C1]" />
              Rental Agreement
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#1A1A2E] px-3 py-1.5 rounded-xl border-2 border-[#1A1A2E] bg-white hover:bg-[#FAFAF7] shadow-[2px_2px_0px_#1A1A2E] transition-all cursor-pointer"
              title="Print legal agreement"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Agreement</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('requirements')}
              className="text-xs font-bold text-[#6B6B8A] hover:text-[#1A1A2E] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Requirements Guide
            </button>
            <button
              type="button"
              onClick={() => onNavigate('book')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#1A1A2E] hover:bg-[#2A2A42] text-white text-xs font-black shadow-[3px_3px_0px_#6B46C1] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-[#F5C6A8]" />
              <span>Book Camera</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12">
        {/* Document Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EDE8FC] text-[#553C9A] border-2 border-[#1A1A2E] shadow-[3px_3px_0px_#1A1A2E] text-xs font-black mb-4">
            <Scale className="w-4 h-4 text-[#6B46C1]" />
            <span>Official Equipment Rental Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#1A1A2E] tracking-tight leading-tight">
            Terms & Conditions
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#6B6B8A] font-medium leading-relaxed">
            Standard rental policies, equipment custody, deposit refunds, and borrower responsibilities for PackAndFilm Camera Rentals ({RENTAL_CONFIG.operatingHours}).
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-black text-[#6B6B8A]">
            <span className="px-2.5 py-1 rounded-md bg-white border border-[#E8E4F0]">
              Version: {RENTAL_CONFIG.termsVersion}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white border border-[#E8E4F0]">
              Effective: {RENTAL_CONFIG.termsLastUpdated}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white border border-[#E8E4F0]">
              Jurisdiction: Pasig City, Metro Manila
            </span>
          </div>
        </div>

        {/* Reassurance Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 print:hidden">
          <div className="p-4 rounded-2xl bg-white border-2 border-[#1A1A2E] shadow-[3px_3px_0px_#1A1A2E] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EDE8FC] border border-[#C9B8F0] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-[#6B46C1]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#1A1A2E]">24h Buffer Policy</h4>
              <p className="text-[11px] text-[#6B6B8A] font-medium">Consecutive bookings get full charging & cleaning turnaround.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-[#1A1A2E] shadow-[3px_3px_0px_#1A1A2E] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8F7F1] border border-emerald-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#1A1A2E]">Prompt Deposit Refund</h4>
              <p className="text-[11px] text-[#6B6B8A] font-medium">₱1,000 security deposit refunded within 24h after inspection.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-[#1A1A2E] shadow-[3px_3px_0px_#1A1A2E] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEF0E7] border border-[#F5C6A8] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#DD6B20]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#1A1A2E]">Transparent Logistics</h4>
              <p className="text-[11px] text-[#6B6B8A] font-medium">Pasig meetup hubs (₱200) or Grab Express directly booked by owner.</p>
            </div>
          </div>
        </div>

        {/* Filter and Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 print:hidden">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#6B6B8A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clauses (e.g. deposit, buffer, late, cancellation)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] text-xs font-bold text-[#1A1A2E] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6B46C1]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="px-3 py-1.5 rounded-xl border border-[#1A1A2E]/20 bg-white hover:bg-[#FAFAF7] text-[11px] font-bold text-[#1A1A2E] cursor-pointer"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-3 py-1.5 rounded-xl border border-[#1A1A2E]/20 bg-white hover:bg-[#FAFAF7] text-[11px] font-bold text-[#6B6B8A] cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Clauses List */}
        <div className="space-y-4">
          {filteredClauses.map((clause, originalIndex) => {
            const index = TERMS_AND_CONDITIONS_DATA.findIndex(c => c.title === clause.title);
            const isExpanded = expandedClauses.includes(index);

            return (
              <div
                key={index}
                className="bg-white rounded-[24px] border-2 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] overflow-hidden transition-all"
              >
                {/* Clause Header Toggle */}
                <button
                  type="button"
                  onClick={() => toggleClause(index)}
                  className="w-full px-5 sm:px-7 py-4.5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAFAF7] transition-colors"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-[#EDE8FC] border-2 border-[#1A1A2E] flex items-center justify-center font-black text-xs text-[#553C9A] shrink-0 shadow-[2px_2px_0px_#1A1A2E]">
                      {index + 1}
                    </div>
                    <h3 className="font-black text-sm sm:text-base text-[#1A1A2E] tracking-tight">
                      {clause.title}
                    </h3>
                  </div>

                  <div className="shrink-0 text-[#1A1A2E]">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#6B6B8A]" />
                    )}
                  </div>
                </button>

                {/* Clause Content */}
                {isExpanded && (
                  <div className="px-5 sm:px-7 pb-6 pt-1 border-t border-[#E8E4F0] animate-fadeIn">
                    <ul className="space-y-3 mt-3">
                      {(clause.content || []).map((item, itemIdx) => (
                        <li
                          key={itemIdx}
                          className="flex items-start gap-3 text-xs sm:text-sm text-[#1A1A2E] font-medium leading-relaxed"
                        >
                          <span className="w-2 h-2 rounded-full bg-[#6B46C1] shrink-0 mt-2" />
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}

          {filteredClauses.length === 0 && (
            <div className="p-8 text-center bg-white rounded-2xl border-2 border-[#1A1A2E]">
              <AlertTriangle className="w-8 h-8 text-[#DD6B20] mx-auto mb-2" />
              <p className="text-sm font-black text-[#1A1A2E]">No clauses match your search "{searchQuery}"</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 px-4 py-1.5 rounded-xl bg-[#EDE8FC] text-xs font-black text-[#553C9A] cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          )}
        </div>

        {/* Legal Disclaimer Box */}
        <div className="mt-8 p-5 rounded-2xl bg-[#EDE8FC] border-2 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] text-xs text-[#44337A] font-medium leading-relaxed">
          <span className="font-black">Acknowledgment Note: </span>
          By proceeding with any booking or settling the ₱300 reservation downpayment, the renter formally covenants and acknowledges that they have reviewed, understood, and agreed to be bound by all eight (8) clauses of this Agreement.
        </div>

        {/* Bottom Booking CTA Banner */}
        <div className="mt-8 bg-white rounded-[28px] border-2 border-[#1A1A2E] shadow-[6px_6px_0px_#1A1A2E] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 print:hidden">
          <div>
            <h4 className="text-base font-black text-[#1A1A2E]">Ready to secure your shoot dates?</h4>
            <p className="text-xs text-[#6B6B8A] font-medium mt-0.5">
              Lock in your DJI Osmo Pocket 3 or Canon G7 X with a ₱300 downpayment credited directly to your rental total.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('book')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1A1A2E] hover:bg-[#2A2A42] text-white text-xs font-black shadow-[3px_3px_0px_#6B46C1] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer text-center whitespace-nowrap"
          >
            Acknowledge & Book Now →
          </button>
        </div>
      </main>
    </div>
  );
};
