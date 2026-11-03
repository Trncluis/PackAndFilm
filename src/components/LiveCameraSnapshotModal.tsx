import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, Upload, ShieldCheck, Sparkles } from 'lucide-react';

interface LiveCameraSnapshotModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  instruction?: string;
  onCapture: (base64DataUrl: string) => void;
  onClose: () => void;
  onFallbackUpload?: () => void;
}

export const LiveCameraSnapshotModal: React.FC<LiveCameraSnapshotModalProps> = ({
  isOpen,
  title = 'Take Live Verification Photo',
  subtitle = 'Hold your Valid IDs and Handwritten Slip clearly in frame',
  instruction = 'Position your face in the center, and hold your IDs and authorization slip steadily next to you.',
  onCapture,
  onClose,
  onFallbackUpload,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'ready' | 'captured' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  // Stop video stream tracks cleanly
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start webcam video stream
  const startCamera = useCallback(async () => {
    setCameraState('starting');
    setErrorMessage('');
    setCapturedImage(null);
    setCountdown(null);

    // Stop existing stream if any
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser. Please upload a photo instead.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState('ready');
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      let msg = 'Could not access camera. Please allow camera permissions in your browser or upload a file.';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = 'Camera permission was denied. Please allow camera access in your browser settings to verify liveness.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = 'No camera device found on this system. Please upload a photo from your device instead.';
        }
      }
      setErrorMessage(msg);
      setCameraState('error');
    }
  }, [stopStream]);

  // Effect: start camera when modal opens, stop when closes
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
      setCameraState('idle');
      setCapturedImage(null);
      setCountdown(null);
    }

    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  // Capture frame from video to canvas
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror the image to match the natural selfie view
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    setCameraState('captured');
    stopStream();
  }, [stopStream]);

  // Take photo with optional 3-second countdown
  const handleSnapWithCountdown = (useTimer = false) => {
    if (!useTimer) {
      // Trigger flash effect
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 200);
      captureFrame();
      return;
    }

    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setIsFlashing(true);
          setTimeout(() => setIsFlashing(false), 200);
          captureFrame();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Confirm photo and return base64
  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-3xl border-2 border-[#1A1A2E] shadow-[8px_8px_0px_#1A1A2E] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8E4F0] bg-[#FAFAF7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EDE8FC] border border-[#C9B8F0] flex items-center justify-center text-[#553C9A] shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-[#1A1A2E] leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-[#6B6B8A] mt-0.5 leading-tight">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E8E4F0] hover:bg-[#FEF0E7] hover:border-[#1A1A2E] flex items-center justify-center text-[#1A1A2E] transition-all cursor-pointer"
            aria-label="Close camera modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Viewfinder */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Helper Instruction Banner */}
          <div className="p-2.5 rounded-xl bg-[#E8F7F1] border border-[#A8DBC8] text-[11px] text-[#234E52] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2F855A] shrink-0" />
            <span className="leading-tight font-medium">{instruction}</span>
          </div>

          {/* Viewfinder Container */}
          <div className="relative aspect-4/3 w-full rounded-2xl border-2 border-[#1A1A2E] bg-[#1A1A2E] overflow-hidden shadow-inner flex items-center justify-center">
            {/* White flash overlay on shutter */}
            {isFlashing && (
              <div className="absolute inset-0 bg-white z-40 animate-pulse pointer-events-none" />
            )}

            {/* Countdown Display */}
            {countdown !== null && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-2xs">
                <div className="w-20 h-20 rounded-full bg-[#1A1A2E] border-4 border-white text-white font-black text-4xl flex items-center justify-center shadow-lg animate-bounce">
                  {countdown}
                </div>
              </div>
            )}

            {/* State: Starting / Loading */}
            {cameraState === 'starting' && (
              <div className="text-center p-6 text-white space-y-2">
                <RefreshCw className="w-8 h-8 text-[#A8DBC8] animate-spin mx-auto" />
                <p className="text-xs font-bold text-gray-200">Initializing your camera...</p>
                <p className="text-[10px] text-gray-400">Please grant browser permissions if prompted</p>
              </div>
            )}

            {/* State: Camera Error */}
            {cameraState === 'error' && (
              <div className="relative z-20 text-center p-6 text-white space-y-3 max-w-sm pointer-events-auto">
                <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-red-300">Camera Unavailable</h4>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
                <div className="pt-2 flex flex-col gap-2 relative z-30 pointer-events-auto">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="relative z-30 px-4 py-2.5 rounded-xl bg-white text-[#1A1A2E] text-xs font-bold hover:bg-gray-100 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                  {onFallbackUpload && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onFallbackUpload();
                      }}
                      className="relative z-30 px-4 py-2.5 rounded-xl bg-[#EDE8FC] text-[#553C9A] text-xs font-bold hover:bg-[#D6BCFA] transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo from Device Instead</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* State: Live Stream Active */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 pointer-events-none ${
                cameraState === 'ready' ? 'opacity-100 relative z-10' : 'opacity-0 absolute hidden'
              }`}
            />

            {/* Framing Guide Overlay (Visual Liveness Target) */}
            {cameraState === 'ready' && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1A1A2E]/80 text-[#A8DBC8] border border-white/20 flex items-center gap-1.5 backdrop-blur-xs">
                    <span className="w-2 h-2 rounded-full bg-[#38A169] animate-ping" />
                    Live Viewfinder
                  </span>
                  <span className="text-[10px] font-semibold text-white/80 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
                    Natural Mirror
                  </span>
                </div>

                {/* Face & ID Framing Target Guides */}
                <div className="relative flex-1 flex items-center justify-center my-2">
                  {/* Face Oval Guide */}
                  <div className="w-32 h-44 sm:w-40 sm:h-52 rounded-full border-2 border-dashed border-white/60 shadow-[0_0_15px_rgba(255,255,255,0.2)] flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white/70 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
                      Your Face Here
                    </span>
                  </div>
                  {/* ID Card Guide Corner Badges */}
                  <div className="absolute right-4 bottom-2 px-2.5 py-1 rounded-lg border border-dashed border-white/70 bg-black/50 text-[10px] text-white font-bold flex items-center gap-1 backdrop-blur-xs">
                    <span>💳 Hold IDs & Slip Here</span>
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-[10px] font-medium text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                    Ensure good lighting and that text on IDs is readable
                  </span>
                </div>
              </div>
            )}

            {/* State: Captured Photo Preview */}
            {cameraState === 'captured' && capturedImage && (
              <div className="relative w-full h-full">
                <img
                  src={capturedImage}
                  alt="Captured Live Snapshot"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#38A169] text-white shadow-md flex items-center gap-1">
                    <Check className="w-3 h-3 text-white" />
                    Snapshot Captured
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            {cameraState === 'ready' && (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSnapWithCountdown(false)}
                  className="px-6 py-3 rounded-full bg-[#1A1A2E] text-white text-xs font-black hover:bg-[#6B46C1] hover:shadow-[3px_3px_0px_#1A1A2E] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <Camera className="w-4 h-4 text-[#F5C6A8] group-hover:scale-110 transition-transform" />
                  <span>Snap Photo Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSnapWithCountdown(true)}
                  className="px-4 py-3 rounded-full bg-[#FAFAF7] border-2 border-[#1A1A2E] text-[#1A1A2E] text-xs font-bold hover:bg-[#EDE8FC] shadow-[2px_2px_0px_#1A1A2E] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#553C9A]" />
                  <span>3s Timer</span>
                </button>
              </div>
            )}

            {cameraState === 'captured' && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#FAFAF7] border-2 border-[#1A1A2E] text-[#1A1A2E] text-xs font-bold hover:bg-[#FEF0E7] shadow-[2px_2px_0px_#1A1A2E] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake Photo</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="w-full sm:w-auto px-7 py-2.5 rounded-full bg-[#38A169] text-white text-xs font-black hover:bg-[#2F855A] shadow-[3px_3px_0px_#1A1A2E] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>Confirm & Use Photo</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Info */}
        <div className="px-5 py-3 border-t border-[#E8E4F0] bg-[#FAFAF7] flex items-center justify-between text-[11px] text-[#6B6B8A]">
          <span className="flex items-center gap-1">
            🔒 <span>End-to-End Encrypted Verification</span>
          </span>
          <span className="text-[10px] text-[#805AD5] font-semibold">
            Live Liveness Check
          </span>
        </div>
      </div>
    </div>
  );
};

