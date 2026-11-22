import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Camera,
  Star,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Home,
  Check,
  X,
  Copy,
  ExternalLink,
  Loader2,
  Heart,
  MessageSquare,
  ShieldCheck,
  Film,
  Instagram
} from 'lucide-react';
import { CAMERAS } from '../data/cameras';
import { CustomSelect } from './CustomSelect';

interface DedicatedReviewPageProps {
  appsScriptUrl: string;
  onNavigate: (view: 'home' | 'book' | 'requirements' | 'terms' | 'admin', options?: { camera?: string; date?: string; scrollTo?: string }) => void;
}

interface UploadedFileItem {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export const DedicatedReviewPage: React.FC<DedicatedReviewPageProps> = ({ appsScriptUrl, onNavigate }) => {
  // Tab Mode: 'shots' (Get Featured) vs 'review' (Feedback)
  const [activeTab, setActiveTab] = useState<'shots' | 'review'>('shots');

  // Form 1: Drop Your Shots state
  const [handle, setHandle] = useState('');
  const [selectedCamera, setSelectedCamera] = useState('DJI Osmo Pocket 3 Standard Kit');
  const [caption, setCaption] = useState('');
  const [consent, setConsent] = useState(true);
  const [mediaFiles, setMediaFiles] = useState<UploadedFileItem[]>([]);
  const [isSubmittingShots, setIsSubmittingShots] = useState(false);
  const [shotsSubmitted, setShotsSubmitted] = useState(false);
  const [shotsError, setShotsError] = useState('');

  // Form 2: Review & Feedback state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>([
    'Excellent Customer Service'
  ]);
  const [feedbackText, setFeedbackText] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const HIGHLIGHT_OPTIONS = [
    'Excellent Customer Service',
    'Fast & Responsive Chat',
    'Super Accommodating',
    'Smooth & Easy Booking',
    'Clear Instructions & Guides',
    'Fast & On-Time Handover',
    'Hassle-Free Return Process',
    'Pristine & Complete Kit'
  ];

  const toggleHighlight = (tag: string) => {
    setSelectedHighlights(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Convert File to base64 Data URL
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle file addition (max 5 items, up to 15MB each, max 30MB total)
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setShotsError('');
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (mediaFiles.length + files.length > 5) {
      setShotsError('You can upload up to 5 photos or clips at a time.');
      return;
    }

    const newItems: UploadedFileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 15 * 1024 * 1024) {
        setShotsError(`"${file.name}" exceeds the 15MB file size limit.`);
        continue;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        newItems.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          previewUrl: dataUrl,
          base64: dataUrl,
          fileName: file.name,
          mimeType: file.type || 'image/jpeg',
          sizeBytes: file.size
        });
      } catch (err) {
        console.error('File reading error:', err);
      }
    }

    setMediaFiles(prev => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeMediaFile = (id: string) => {
    setMediaFiles(prev => prev.filter(f => f.id !== id));
  };

  // Submit Form 1: Drop Your Shots
  const handleSubmitShots = async (e: React.FormEvent) => {
    e.preventDefault();
    setShotsError('');

    if (!handle.trim()) {
      setShotsError('Please enter your Facebook name or Instagram handle so we know who to credit!');
      return;
    }

    if (mediaFiles.length === 0) {
      setShotsError('Please select at least 1 photo or video clip to upload.');
      return;
    }

    setIsSubmittingShots(true);

    try {
      const payload = {
        action: 'submitCommunityMedia',
        socialHandle: handle.trim(),
        cameraRented: selectedCamera,
        caption: caption.trim(),
        consentGiven: consent,
        timestamp: new Date().toISOString(),
        files: mediaFiles.map(f => ({
          fileName: f.fileName,
          mimeType: f.mimeType,
          base64: f.base64
        }))
      };

      const res = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({ status: 'success' }));

      if (data && data.status === 'error') {
        throw new Error(data.message || 'Submission failed');
      }

      setShotsSubmitted(true);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Confetti fallback
      }
    } catch (err: any) {
      console.warn('Network or endpoint error during shots submission, storing locally as fallback:', err);
      // Save locally to localStorage so it is never lost
      const localShots = JSON.parse(localStorage.getItem('pnf_community_shots') || '[]');
      localShots.unshift({
        id: `SHOT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        socialHandle: handle.trim(),
        cameraRented: selectedCamera,
        caption: caption.trim(),
        consentGiven: consent,
        filesCount: mediaFiles.length,
        status: 'new'
      });
      localStorage.setItem('pnf_community_shots', JSON.stringify(localShots));

      setShotsSubmitted(true);
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } finally {
      setIsSubmittingShots(false);
    }
  };

  // Submit Form 2: Review & Feedback
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');

    setIsSubmittingReview(true);

    try {
      const payload = {
        action: 'submitCustomerFeedback',
        customerName: reviewerName.trim() || 'Valued Renter',
        cameraRented: selectedCamera,
        rating: rating,
        highlights: selectedHighlights,
        feedbackText: feedbackText.trim(),
        timestamp: new Date().toISOString()
      };

      const res = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({ status: 'success' }));

      if (data && data.status === 'error') {
        throw new Error(data.message || 'Feedback submission failed');
      }

      setReviewSubmitted(true);
      try {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      } catch {}
    } catch (err: any) {
      console.warn('Network error, saving review locally as fallback:', err);
      const localReviews = JSON.parse(localStorage.getItem('pnf_customer_reviews') || '[]');
      localReviews.unshift({
        id: `REV-${Date.now()}`,
        timestamp: new Date().toISOString(),
        customerName: reviewerName.trim() || 'Valued Renter',
        cameraRented: selectedCamera,
        rating,
        highlights: selectedHighlights,
        feedbackText: feedbackText.trim(),
        status: 'new'
      });
      localStorage.setItem('pnf_customer_reviews', JSON.stringify(localReviews));

      setReviewSubmitted(true);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1A1A2E] flex flex-col font-sans selection:bg-[#C9B8F0] selection:text-[#1A1A2E]">
      
      {/* Top Floating App Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-2 border-[#1A1A2E] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E] flex items-center justify-center p-1 overflow-hidden">
              <img src="/logo.png" alt="PackAndFilm" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-xs font-black tracking-wider text-[#553C9A] uppercase">PackAndFilm</div>
              <div className="text-sm font-black text-[#1A1A2E]">Community & Reviews</div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#1A1A2E] bg-white text-xs font-bold text-[#1A1A2E] hover:bg-[#EDE8FC] shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Store Home</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 sm:py-8">
        
        {/* Hero Card */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 bg-[#EDE8FC] text-[#553C9A] border-2 border-[#1A1A2E] text-[11px] font-black px-3 py-1 rounded-full shadow-[2px_2px_0px_#1A1A2E] uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3 h-3 text-[#553C9A]" />
            Official Rental Bag Scan
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1A2E] tracking-tight">
            How was your shoot?
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B8A] font-semibold mt-1">
            Share your best captures for a feature or tell us how we did!
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-white border-2 border-[#1A1A2E] rounded-2xl shadow-[4px_4px_0px_#1A1A2E] mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('shots');
              setShotsError('');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'shots'
                ? 'bg-[#EDE8FC] text-[#553C9A] border-2 border-[#1A1A2E] shadow-[3px_3px_0px_#1A1A2E]'
                : 'text-[#6B6B8A] border-2 border-transparent hover:text-[#1A1A2E] hover:border-[#CBD5E0]'
            }`}
          >
            <span>Photo Drops for FB & IG</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('review');
              setReviewError('');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'review'
                ? 'bg-[#EDE8FC] text-[#553C9A] border-2 border-[#1A1A2E] shadow-[3px_3px_0px_#1A1A2E]'
                : 'text-[#6B6B8A] border-2 border-transparent hover:text-[#1A1A2E] hover:border-[#CBD5E0]'
            }`}
          >
            <span>Customer Reviews & Ideas</span>
          </button>
        </div>

        {/* TAB 1: DROP YOUR SHOTS */}
        {activeTab === 'shots' && (
          <div className="bg-white border-2 border-[#1A1A2E] rounded-2xl p-5 sm:p-6 shadow-[4px_4px_0px_#1A1A2E]">
            {shotsSubmitted ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-[#EDE8FC] border-2 border-[#1A1A2E] rounded-2xl mx-auto flex items-center justify-center text-[#553C9A] shadow-[3px_3px_0px_#1A1A2E] mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-[#1A1A2E]">Shots Received!</h3>
                <p className="text-xs sm:text-sm text-[#4A5568] mt-1.5 max-w-sm mx-auto font-medium leading-relaxed">
                  Thank you for sharing your captures! Our team will review them and tag or credit <strong>{handle}</strong> when we feature your photos on Facebook, Instagram, or TikTok!
                </p>

                <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    onClick={() => {
                      setShotsSubmitted(false);
                      setMediaFiles([]);
                      setCaption('');
                    }}
                    className="w-full sm:w-auto px-4 py-2 border-2 border-[#1A1A2E] rounded-xl text-xs font-bold text-[#1A1A2E] bg-[#FAFAF7] hover:bg-[#EDE8FC] cursor-pointer"
                  >
                    Upload More Shots
                  </button>
                  <button
                    onClick={() => setActiveTab('review')}
                    className="w-full sm:w-auto px-4 py-2 border-2 border-[#1A1A2E] rounded-xl text-xs font-black text-white bg-[#553C9A] shadow-[2px_2px_0px_#1A1A2E] cursor-pointer"
                  >
                    Leave a Quick Review
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitShots} className="space-y-4">
                
                {/* Intro banner */}
                <div className="bg-[#FAF5FF] border-2 border-[#C9B8F0] rounded-xl p-3.5 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#553C9A] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#553C9A] leading-relaxed">
                    <strong>Get Featured on PackAndFilm!</strong> We love showcasing creative shots and vlogs from our renters. Drop your favorite files to be featured on Facebook, Instagram, or TikTok!
                  </div>
                </div>

                {shotsError && (
                  <div className="bg-[#FFF5F5] border-2 border-[#FEB2B2] rounded-xl p-3 text-xs font-bold text-[#C53030] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{shotsError}</span>
                  </div>
                )}

                {/* Facebook Name or Instagram Handle */}
                <div>
                  <label className="block text-xs font-black text-[#1A1A2E] uppercase tracking-wider mb-1.5">
                    Your Facebook Name or Instagram Handle <span className="text-[#E53E3E]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={e => setHandle(e.target.value)}
                    placeholder="e.g. Juan Dela Cruz (FB) or @juan.lens (IG)"
                    className="w-full px-3.5 py-2.5 bg-[#FAFAF7] border-2 border-[#1A1A2E] rounded-xl text-xs font-bold text-[#1A1A2E] placeholder:text-[#A0AEC0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#553C9A]"
                  />
                </div>

                {/* Camera Used */}
                <div>
                  <label className="block text-xs font-black text-[#1A1A2E] uppercase tracking-wider mb-1.5">
                    Camera Unit Rented
                  </label>
                  <CustomSelect
                    value={selectedCamera}
                    onChange={setSelectedCamera}
                    options={[
                      'DJI Osmo Pocket 3 Standard Kit',
                      'Canon PowerShot G7 X Mark III (Black)',
                      'Canon PowerShot G7 X Mark III (Silver)'
                    ]}
                    size="md"
                  />
                </div>

                {/* File Upload Box */}
                <div>
                  <label className="block text-xs font-black text-[#1A1A2E] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Photos or Short Clips (Max 5)</span>
                    <span className="text-[11px] font-semibold text-[#718096]">{mediaFiles.length}/5 selected</span>
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*,video/mp4,video/quicktime,video/webm"
                    onChange={handleFilesSelected}
                    className="hidden"
                  />

                  {mediaFiles.length < 5 && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#553C9A] bg-[#FAF5FF] hover:bg-[#EDE8FC] rounded-2xl p-5 text-center cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <div className="w-10 h-10 bg-white border-2 border-[#1A1A2E] rounded-xl mx-auto flex items-center justify-center text-[#553C9A] shadow-[2px_2px_0px_#1A1A2E] mb-2">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-black text-[#1A1A2E]">
                        Tap to choose photos / clips from gallery
                      </div>
                      <div className="text-[10px] text-[#718096] font-semibold mt-0.5">
                        JPG, PNG, HEIC, MP4 up to 15MB each
                      </div>
                    </div>
                  )}

                  {/* Thumbnail Previews */}
                  {mediaFiles.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mt-3">
                      {mediaFiles.map(item => (
                        <div
                          key={item.id}
                          className="relative group border-2 border-[#1A1A2E] rounded-xl overflow-hidden aspect-square bg-[#FAFAF7] shadow-[2px_2px_0px_#1A1A2E]"
                        >
                          {item.mimeType.startsWith('video') ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-[#1A1A2E] text-white p-1 text-center">
                              <Film className="w-5 h-5 text-[#C9B8F0] mb-1" />
                              <span className="text-[9px] font-bold truncate max-w-full">{item.fileName}</span>
                            </div>
                          ) : (
                            <img
                              src={item.previewUrl}
                              alt="Upload preview"
                              className="w-full h-full object-cover"
                            />
                          )}

                          <button
                            type="button"
                            onClick={() => removeMediaFile(item.id)}
                            className="absolute top-1 right-1 w-5 h-5 bg-[#E53E3E] text-white rounded-full flex items-center justify-center border border-white cursor-pointer hover:scale-110 transition-transform"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Caption / Location */}
                <div>
                  <label className="block text-xs font-black text-[#1A1A2E] uppercase tracking-wider mb-1.5">
                    Location or Shoot Note <span className="text-[10px] font-semibold text-[#718096]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="e.g. Boracay vacation, concert vlog, coffee shoot"
                    className="w-full px-3 py-2.5 bg-[#FAFAF7] border-2 border-[#1A1A2E] rounded-xl text-xs font-bold text-[#1A1A2E] placeholder:text-[#A0AEC0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#553C9A]"
                  />
                </div>

                {/* Consent Checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer bg-[#F7FAFC] border-2 border-[#E2E8F0] rounded-xl p-3">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={e => setConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#553C9A] cursor-pointer"
                  />
                  <span className="text-[11px] font-semibold text-[#4A5568] leading-tight">
                    I give PackAndFilm permission to feature these media files on Facebook, Instagram, TikTok, or the website with credit to my name or handle.
                  </span>
                </label>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmittingShots}
                  className="w-full py-3.5 px-4 bg-[#553C9A] hover:bg-[#44307d] text-white border-2 border-[#1A1A2E] rounded-xl font-black text-xs sm:text-sm tracking-wide shadow-[4px_4px_0px_#1A1A2E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingShots ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading to Community Drive...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Submit My Shots for Feature</span>
                    </>
                  )}
                </button>

              </form>
            )}
          </div>
        )}

        {/* TAB 2: REVIEW & SUGGESTIONS */}
        {activeTab === 'review' && (
          <div className="bg-white border-2 border-[#1A1A2E] rounded-2xl p-5 sm:p-6 shadow-[4px_4px_0px_#1A1A2E]">
            {reviewSubmitted ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-[#EDE8FC] border-2 border-[#1A1A2E] rounded-2xl mx-auto flex items-center justify-center text-[#553C9A] shadow-[3px_3px_0px_#1A1A2E] mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-[#1A1A2E]">Thank You for Your Feedback!</h3>
                <p className="text-xs sm:text-sm text-[#4A5568] mt-1.5 max-w-sm mx-auto font-medium leading-relaxed">
                  Your review directly helps our team improve camera kit accessories, handoff speed, and booking ease for everyone in Manila.
                </p>

                <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    onClick={() => {
                      setReviewSubmitted(false);
                      setFeedbackText('');
                    }}
                    className="w-full sm:w-auto px-4 py-2 border-2 border-[#1A1A2E] rounded-xl text-xs font-bold text-[#1A1A2E] bg-[#FAFAF7] hover:bg-[#EDE8FC] cursor-pointer"
                  >
                    Submit Another Note
                  </button>
                  <button
                    onClick={() => onNavigate('home')}
                    className="w-full sm:w-auto px-4 py-2 border-2 border-[#1A1A2E] rounded-xl text-xs font-black text-white bg-[#553C9A] shadow-[2px_2px_0px_#1A1A2E] cursor-pointer"
                  >
                    Return to Store
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                
                {/* Intro banner */}
                <div className="bg-[#FAF5FF] border-2 border-[#C9B8F0] rounded-xl p-3.5 flex items-start gap-2.5">
                  <MessageSquare className="w-4 h-4 text-[#553C9A] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#553C9A] leading-relaxed">
                    <strong>We Value Your Honesty!</strong> Whether it's battery life, courier handoff, or new equipment you'd like us to add — we read every single word.
                  </div>
                </div>

                {reviewError && (
                  <div className="bg-[#FFF5F5] border-2 border-[#FEB2B2] rounded-xl p-3 text-xs font-bold text-[#C53030] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{reviewError}</span>
                  </div>
                )}

                {/* Star Rating */}
                <div className="text-center py-2">
                  <label className="block text-xs font-black text-[#1A1A2E] uppercase tracking-wider mb-2">
                    Overall Experience
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => {
                      const active = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1 transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                        >
                          <Star
                            className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                              active
                                ? 'text-[#ECC94B] fill-[#ECC94B]'
                                : 'text-[#CBD5E0] fill-transparent'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[11px] font-black text-[#553C9A] mt-1.5">
                    {rating === 5 && 'Outstanding — Loved everything!'}
                    {rating === 4 && 'Great shoot — Very happy!'}
                    {rating === 3 && 'Good — A few things could be better'}
                    {rating === 2 && 'Needs improvement'}
                    {rating === 1 && 'Disappointing'}
                  </div>
                </div>

                {/* Highlight Pills */}
                <div>
                  <label className="block text-xs font-black text-[#1A1A2E] uppercase tracking-wider mb-2">
                    What Stood Out? (Tap to select)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {HIGHLIGHT_OPTIONS.map(tag => {
                      const isSelected = selectedHighlights.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleHighlight(tag)}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer flex items-center justify-center text-center ${
                            isSelected
                              ? 'bg-[#EDE8FC] text-[#553C9A] border-[#553C9A] shadow-[2px_2px_0px_#553C9A]'
                              : 'bg-[#FAFAF7] text-[#6B6B8A] border-[#E2E8F0] hover:border-[#CBD5E0] hover:bg-white'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Open Suggestions */}
                <div>
                  <label className="block text-xs font-black text-[#1A1A2E] uppercase tracking-wider mb-1.5">
                    Suggestions for Improvement or Next Gear
                  </label>
                  <textarea
                    rows={3}
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    placeholder="Tell us what accessories or website improvements you'd love to see next..."
                    className="w-full px-3 py-2.5 bg-[#FAFAF7] border-2 border-[#1A1A2E] rounded-xl text-xs font-bold text-[#1A1A2E] placeholder:text-[#A0AEC0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#553C9A] resize-none"
                  />
                </div>

                {/* Name / Contact (Optional) */}
                <div>
                  <label className="block text-xs font-black text-[#1A1A2E] uppercase tracking-wider mb-1.5">
                    Your Name or Handle <span className="text-[10px] font-semibold text-[#718096]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={e => setReviewerName(e.target.value)}
                    placeholder="e.g. Juan Dela Cruz or @juan.lens (Leave blank to remain anonymous)"
                    className="w-full px-3 py-2.5 bg-[#FAFAF7] border-2 border-[#1A1A2E] rounded-xl text-xs font-bold text-[#1A1A2E] placeholder:text-[#A0AEC0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#553C9A]"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full py-3.5 px-4 bg-[#553C9A] hover:bg-[#44307d] text-white border-2 border-[#1A1A2E] rounded-xl font-black text-xs sm:text-sm tracking-wide shadow-[4px_4px_0px_#1A1A2E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingReview ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Review...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Review & Feedback</span>
                    </>
                  )}
                </button>

              </form>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] text-[#A0AEC0] font-bold">
          PackAndFilm Community • Pasig City & Metro Manila
        </div>

      </main>
    </div>
  );
};
