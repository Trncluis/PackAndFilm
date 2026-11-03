import React, { useState } from 'react';
import {
  ShieldCheck,
  FileCheck,
  CreditCard,
  UserCheck,
  Camera,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  ArrowRight,
  Home,
  GraduationCap,
  Sparkles,
  Lock,
  PhoneCall,
  Clock,
  FileText
} from 'lucide-react';
import { FIVE_STEP_REQUIREMENTS, STUDENT_EXEMPTION_NOTICE } from '../data/requirements';
import { RENTAL_CONFIG } from '../data/rentalConfig';

interface DedicatedRequirementsPageProps {
  onNavigate: (view: 'home' | 'book' | 'requirements' | 'terms' | 'admin', options?: { camera?: string; date?: string; scrollTo?: string }) => void;
}

export const DedicatedRequirementsPage: React.FC<DedicatedRequirementsPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ids' | 'students' | 'slip' | 'faq'>('overview');

  const primaryIds = [
    'Philippine Passport',
    'Driver’s License (LTO)',
    'Unified Multi-Purpose ID (UMID)',
    'Philippine National ID (PhilID / ePhilID)',
    'Professional Regulation Commission (PRC) ID'
  ];

  const secondaryIds = [
    'Company / Employee ID',
    'Student ID (with current Certificate of Registration)',
    'Postal ID (Digital or PVC)',
    'PhilHealth Card',
    'TIN Card',
    'Voter’s ID / Voter Certificate',
    'Barangay Clearance / ID'
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1A1A2E] flex flex-col font-sans selection:bg-[#C9B8F0] selection:text-[#1A1A2E]">
      {/* Top Header / Breadcrumbs */}
      <header className="sticky top-0 z-40 bg-[#FAFAF7]/95 backdrop-blur-md border-b-2 border-[#1A1A2E] px-4 sm:px-8 py-3.5 transition-all">
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
              <ShieldCheck className="w-3.5 h-3.5 text-[#6B46C1]" />
              Verification Handbook
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('terms')}
              className="text-xs font-bold text-[#6B6B8A] hover:text-[#1A1A2E] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Terms & Conditions
            </button>
            <button
              type="button"
              onClick={() => onNavigate('book')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#1A1A2E] hover:bg-[#6B46C1] text-white text-xs font-black hover:shadow-[3px_3px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-[#F5C6A8]" />
              <span>Book Camera</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FEF0E7] text-[#C05621] border-2 border-[#1A1A2E] shadow-[3px_3px_0px_#1A1A2E] text-xs font-black mb-4">
            <ShieldCheck className="w-4 h-4 text-[#DD6B20]" />
            <span>Official KYC & Security Protocol</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#1A1A2E] tracking-tight leading-tight">
            Rental Requirements & Verification Guide
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#6B6B8A] font-medium leading-relaxed">
            Everything you need to rent a DJI Pocket 3 or Canon G7 X in Metro Manila. We verify identities once to safeguard high-end production equipment and keep security deposits affordable.
          </p>
        </div>

        {/* Quick Nav Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
          {[
            { id: 'overview', label: '5-Step Overview', icon: FileCheck },
            { id: 'ids', label: 'Accepted IDs', icon: CreditCard },
            { id: 'students', label: 'Student Alternative', icon: GraduationCap },
            { id: 'slip', label: 'Authorization Slip & Selfie', icon: Camera },
            { id: 'faq', label: 'Verification FAQ', icon: HelpCircle }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 font-black text-xs whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#1A1A2E] bg-[#EDE8FC] text-[#553C9A] shadow-[4px_4px_0px_#1A1A2E]'
                    : 'border-[#1A1A2E]/20 bg-white text-[#6B6B8A] hover:border-[#1A1A2E] hover:text-[#1A1A2E]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#6B46C1]' : 'text-[#6B6B8A]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: 5-STEP OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {FIVE_STEP_REQUIREMENTS.map((req) => (
                <div
                  key={req.step}
                  className="bg-white rounded-[28px] border-2 border-[#1A1A2E] shadow-[5px_5px_0px_#1A1A2E] p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-[#EDE8FC] border-2 border-[#1A1A2E] flex items-center justify-center font-black text-[#6B46C1] text-base shadow-[2px_2px_0px_#1A1A2E]">
                        0{req.step}
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#FEF0E7] text-[#C05621] border border-[#F5C6A8]">
                        {req.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-[#1A1A2E] mb-2">{req.title}</h3>
                    <p className="text-xs text-[#6B6B8A] font-medium mb-4 leading-relaxed">{req.desc}</p>

                    <div className="space-y-2 mb-4">
                      {req.details.map((detail, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-[#1A1A2E] font-medium leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E8E4F0] flex items-center gap-2 text-[11px] font-bold text-[#6B6B8A]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#6B46C1] shrink-0" />
                    <span>{req.mandatoryText}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Student Exemption Banner */}
            <div className="bg-[#FEF0E7] rounded-[28px] border-2 border-[#1A1A2E] shadow-[5px_5px_0px_#1A1A2E] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#1A1A2E] flex items-center justify-center shadow-[3px_3px_0px_#1A1A2E] shrink-0">
                  <GraduationCap className="w-6 h-6 text-[#DD6B20]" />
                </div>
                <div>
                  <h4 className="text-base font-black text-[#1A1A2E]">{STUDENT_EXEMPTION_NOTICE.title}</h4>
                  <p className="text-xs text-[#7B341E] font-medium mt-0.5">
                    {STUDENT_EXEMPTION_NOTICE.desc}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('students')}
                className="px-4 py-2 rounded-xl bg-white border-2 border-[#1A1A2E] text-xs font-black shadow-[2px_2px_0px_#1A1A2E] hover:bg-[#FFF] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer whitespace-nowrap"
              >
                View Student Guide →
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: ACCEPTED IDS */}
        {activeTab === 'ids' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary IDs */}
              <div className="bg-white rounded-[28px] border-2 border-[#1A1A2E] shadow-[6px_6px_0px_#1A1A2E] p-6 sm:p-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE8FC] text-[#553C9A] border border-[#C9B8F0] text-xs font-black mb-3">
                  <CreditCard className="w-3.5 h-3.5 text-[#6B46C1]" />
                  <span>Tier 1 Government IDs</span>
                </div>
                <h3 className="text-2xl font-black text-[#1A1A2E] mb-2">Primary Valid IDs</h3>
                <p className="text-xs text-[#6B6B8A] font-medium mb-6">
                  Provide at least one primary government-issued ID showing your current residential address and signature.
                </p>

                <div className="space-y-3">
                  {primaryIds.map((id, index) => (
                    <div
                      key={index}
                      className="p-3.5 rounded-2xl bg-[#FAFAF7] border-2 border-[#E8E4F0] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-black text-xs">
                          ✓
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-[#1A1A2E]">{id}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Primary
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secondary IDs */}
              <div className="bg-white rounded-[28px] border-2 border-[#1A1A2E] shadow-[6px_6px_0px_#1A1A2E] p-6 sm:p-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF0E7] text-[#C05621] border border-[#F5C6A8] text-xs font-black mb-3">
                  <FileText className="w-3.5 h-3.5 text-[#DD6B20]" />
                  <span>Tier 2 Supporting IDs</span>
                </div>
                <h3 className="text-2xl font-black text-[#1A1A2E] mb-2">Secondary Supporting IDs</h3>
                <p className="text-xs text-[#6B6B8A] font-medium mb-6">
                  Paired alongside your primary ID to confirm identity consistency and address records.
                </p>

                <div className="space-y-3">
                  {secondaryIds.map((id, index) => (
                    <div
                      key={index}
                      className="p-3.5 rounded-2xl bg-[#FAFAF7] border-2 border-[#E8E4F0] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-black text-xs">
                          +
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-[#1A1A2E]">{id}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Supporting
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Important ID Note */}
            <div className="p-5 rounded-2xl bg-[#E8F7F1] border-2 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs font-medium text-emerald-900 leading-relaxed">
                <span className="font-black">Clear Photo Rule: </span>
                Ensure photos of your IDs are taken on a flat surface in good lighting without flash glare. Both front and back photos must be readable.
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STUDENT EXEMPTION */}
        {activeTab === 'students' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-[32px] border-2 border-[#1A1A2E] shadow-[8px_8px_0px_#1A1A2E] p-6 sm:p-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE8FC] text-[#553C9A] border border-[#C9B8F0] text-xs font-black mb-3">
                <GraduationCap className="w-4 h-4 text-[#6B46C1]" />
                <span>Student Friendly Policy</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#1A1A2E] mb-3">
                Don't have 2 Government IDs? Rent with your Student ID!
              </h3>
              <p className="text-sm text-[#6B6B8A] font-medium leading-relaxed mb-8">
                We support student creators, vloggers, and campus journalists across Metro Manila. You do not need to wait for government ID releases to rent gear with us.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-5 rounded-2xl bg-[#FAFAF7] border-2 border-[#1A1A2E] shadow-[3px_3px_0px_#1A1A2E]">
                  <div className="w-8 h-8 rounded-xl bg-[#EDE8FC] border border-[#C9B8F0] flex items-center justify-center font-black text-xs text-[#6B46C1] mb-3">
                    1
                  </div>
                  <h4 className="text-sm font-black text-[#1A1A2E] mb-1">Current Student ID</h4>
                  <p className="text-xs text-[#6B6B8A] font-medium">Valid school identification card for the active academic year.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAFAF7] border-2 border-[#1A1A2E] shadow-[3px_3px_0px_#1A1A2E]">
                  <div className="w-8 h-8 rounded-xl bg-[#FEF0E7] border border-[#F5C6A8] flex items-center justify-center font-black text-xs text-[#DD6B20] mb-3">
                    2
                  </div>
                  <h4 className="text-sm font-black text-[#1A1A2E] mb-1">Certificate of Registration</h4>
                  <p className="text-xs text-[#6B6B8A] font-medium">Official enrollment form or COR showing active enrollment status.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAFAF7] border-2 border-[#1A1A2E] shadow-[3px_3px_0px_#1A1A2E]">
                  <div className="w-8 h-8 rounded-xl bg-[#E8F7F1] border border-emerald-300 flex items-center justify-center font-black text-xs text-emerald-700 mb-3">
                    3
                  </div>
                  <h4 className="text-sm font-black text-[#1A1A2E] mb-1">Guardian Government ID</h4>
                  <p className="text-xs text-[#6B6B8A] font-medium">Valid government ID of your parent or legal guardian for secondary reference.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FEF0E7] border border-[#F5C6A8] text-xs text-[#7B341E] font-medium flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#DD6B20] shrink-0" />
                <span>Simply toggle the <strong>"Student Exemption"</strong> switch when filling out Step 3 of our booking checkout.</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUTHORIZATION SLIP & SELFIE */}
        {activeTab === 'slip' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Slip Template */}
              <div className="bg-white rounded-[28px] border-2 border-[#1A1A2E] shadow-[6px_6px_0px_#1A1A2E] p-6 sm:p-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE8FC] text-[#553C9A] border border-[#C9B8F0] text-xs font-black mb-3">
                  <FileText className="w-3.5 h-3.5 text-[#6B46C1]" />
                  <span>Handwritten Slip Template</span>
                </div>
                <h3 className="text-2xl font-black text-[#1A1A2E] mb-2">Authorization Paper Slip</h3>
                <p className="text-xs text-[#6B6B8A] font-medium mb-6">
                  On a clean white sheet of paper, write the following by hand with a blue or black pen:
                </p>

                {/* Visual Specimen Paper Mockup */}
                <div className="p-6 rounded-2xl border-2 border-dashed border-[#1A1A2E] bg-[#FAFAF7] font-mono text-xs leading-relaxed space-y-4">
                  <div className="text-right text-[#6B6B8A] text-[11px]">
                    Date: [Today’s Date, e.g., Nov 02, 2026]
                  </div>
                  <div className="text-center font-black text-sm text-[#1A1A2E] py-2 border-y border-[#E8E4F0]">
                    "For Pack and Film Camera Rental purposes only"
                  </div>
                  <div className="space-y-2 pt-2">
                    <p className="text-[11px] text-[#6B6B8A] font-sans">Three (3) Specimen Signatures:</p>
                    <div className="grid grid-cols-3 gap-2 text-center italic text-sm text-[#553C9A] py-3 bg-white rounded-xl border border-[#E8E4F0]">
                      <span>Signature 1</span>
                      <span>Signature 2</span>
                      <span>Signature 3</span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-[11px] text-[#6B6B8A] font-medium">
                  Place this slip next to your two valid IDs and take a single clear overhead photo.
                </p>
              </div>

              {/* Selfie Guide */}
              <div className="bg-white rounded-[28px] border-2 border-[#1A1A2E] shadow-[6px_6px_0px_#1A1A2E] p-6 sm:p-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F7F1] text-emerald-800 border border-emerald-300 text-xs font-black mb-3">
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Selfie Photo Checklist</span>
                </div>
                <h3 className="text-2xl font-black text-[#1A1A2E] mb-2">Selfie Holding Your IDs</h3>
                <p className="text-xs text-[#6B6B8A] font-medium mb-6">
                  Take a photo of yourself holding your 2 valid IDs and the handwritten slip under your chest.
                </p>

                <div className="space-y-3">
                  {[
                    'Your entire face must be clearly visible (no face masks, dark sunglasses, or heavy filters).',
                    'Hold your IDs beside your chest so the camera captures both your face and the ID text clearly.',
                    'Make sure the details on your IDs are readable and not blurred by hand movement or glare.',
                    'You can use your phone camera or our built-in web snapshot tool during checkout.'
                  ].map((tip, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#FAFAF7] border border-[#E8E4F0] flex items-start gap-2.5 text-xs text-[#1A1A2E] font-medium leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FAQ */}
        {activeTab === 'faq' && (
          <div className="space-y-4 animate-fadeIn">
            {[
              {
                q: 'Why do you need two valid IDs and an authorization slip?',
                a: 'Camera gear (DJI Osmo Pocket 3 and Canon PowerShot G7 X Mark III) are high-value professional production assets. Verifying identities protects against theft and fraud, allowing us to keep rental fees low and security deposits minimal (₱1,000 only instead of the full ₱35,000+ equipment value).'
              },
              {
                q: 'What if my utility bill is not under my name?',
                a: 'If you are renting a residence, living with family, or dorming, you can provide at least two (2) online delivery parcel receipts (Shopee, Lazada, or TikTok Shop) showing your full name and delivery address, OR provide a copy of your landlord/parent’s government ID.'
              },
              {
                q: 'How long does the KYC review take?',
                a: 'Verification is fast! Once you submit the booking form and downpayment, we review your documents within 15–30 minutes during our standard operating hours (8:00 AM – 11:00 PM daily).'
              },
              {
                q: 'Is my personal data safe and protected?',
                a: 'Yes, 100%. All uploaded identification documents are securely stored in private Google Drive folders with restricted admin-only access. Your data is used exclusively for equipment security and is purged in accordance with the Philippine Data Privacy Act of 2012.'
              }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-2xl border-2 border-[#1A1A2E] shadow-[3px_3px_0px_#1A1A2E] p-5">
                <h4 className="text-sm font-black text-[#1A1A2E] mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#6B46C1] shrink-0" />
                  <span>{item.q}</span>
                </h4>
                <p className="text-xs text-[#6B6B8A] font-medium leading-relaxed pl-6">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Security & Privacy Commitment */}
        <div className="mt-12 bg-white rounded-[28px] border-2 border-[#1A1A2E] shadow-[6px_6px_0px_#1A1A2E] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EDE8FC] border-2 border-[#1A1A2E] flex items-center justify-center shadow-[3px_3px_0px_#1A1A2E] shrink-0">
              <Lock className="w-6 h-6 text-[#6B46C1]" />
            </div>
            <div>
              <h4 className="text-base font-black text-[#1A1A2E]">Philippine Data Privacy Act (DPA 2012) Compliant</h4>
              <p className="text-xs text-[#6B6B8A] font-medium mt-0.5">
                Your submitted documents are encrypted, stored in private admin vaults, and deleted upon successful gear return.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onNavigate('terms')}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border-2 border-[#1A1A2E] bg-[#FAFAF7] hover:bg-white text-xs font-black shadow-[2px_2px_0px_#1A1A2E] cursor-pointer text-center"
            >
              Read Terms
            </button>
            <button
              type="button"
              onClick={() => onNavigate('book')}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#1A1A2E] hover:bg-[#6B46C1] text-white text-xs font-black hover:shadow-[3px_3px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer text-center whitespace-nowrap"
            >
              Start Booking →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
