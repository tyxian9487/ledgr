import { useState, useRef, useCallback } from 'react';
import { Camera, X, RefreshCw, ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ManualEntryModal from '../components/home/ManualEntryModal';
import { TransactionType } from '../types';

type Stage = 'preview' | 'capturing' | 'processing' | 'review';

interface ParsedReceipt {
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
}

function parseReceiptMock(imageDataUrl: string): Promise<ParsedReceipt> {
  return new Promise(resolve => {
    setTimeout(() => {
      const hash = imageDataUrl.length % 5;
      const mocks: ParsedReceipt[] = [
        { type: 'expense', amount: 42.50, category: 'food', description: 'Restaurant meal' },
        { type: 'expense', amount: 89.99, category: 'shopping', description: 'Retail purchase' },
        { type: 'expense', amount: 15.00, category: 'transport', description: 'Ride service' },
        { type: 'expense', amount: 120.00, category: 'health', description: 'Pharmacy' },
        { type: 'expense', amount: 65.75, category: 'utilities', description: 'Service bill' },
      ];
      resolve(mocks[hash]);
    }, 2000);
  });
}

export default function ReceiptCapture() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>('preview');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError('Camera access denied or not available. Please allow camera access and try again.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const MAX_W = 600;
    const scale = Math.min(1, MAX_W / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx2d = canvas.getContext('2d');
    ctx2d?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
    stopCamera();
    setCapturedImage(dataUrl);
    setStage('processing');
    const result = await parseReceiptMock(dataUrl);
    setParsed(result);
    setStage('review');
  }, [stopCamera]);

  const handleGalleryUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setCapturedImage(dataUrl);
      setStage('processing');
      const result = await parseReceiptMock(dataUrl);
      setParsed(result);
      setStage('review');
    };
    reader.readAsDataURL(file);
    // reset input so same file can be re-selected
    e.target.value = '';
  }, [stopCamera]);

  const reset = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setParsed(null);
    setCameraError(null);
    setStage('preview');
    setCameraActive(false);
  }, [stopCamera]);

  if (stage === 'review' && parsed) {
    return (
      <ManualEntryModal
        prefill={{ ...parsed, receiptImage: capturedImage ?? undefined }}
        onClose={() => { navigate('/'); }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col max-w-[430px] mx-auto">
      {/* Viewfinder */}
      <div className="flex-1 relative overflow-hidden">
        {cameraActive ? (
          <>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-2/3 border-2 border-white/60 rounded-2xl" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }} />
            </div>
            <p className="absolute bottom-36 left-0 right-0 text-center text-white/80 text-xs">
              Align receipt within frame
            </p>
            {/* Gallery button overlay while camera is active */}
            <button
              onClick={() => galleryRef.current?.click()}
              className="absolute bottom-32 right-6 flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5"
            >
              <ImageIcon size={14} className="text-white" />
              <span className="text-white text-xs font-medium">Gallery</span>
            </button>
          </>
        ) : stage === 'processing' && capturedImage ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <img src={capturedImage} alt="Captured" className="w-3/4 rounded-2xl opacity-50 object-contain max-h-64" />
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-t-white rounded-full animate-spin border-white/30" style={{ borderWidth: 3, borderStyle: 'solid' }} />
              <p className="text-white font-medium text-sm">Analyzing receipt...</p>
              <p className="text-white/60 text-xs">AI is reading your receipt</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-8">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-2">
              <Camera size={40} className="text-white/60" />
            </div>
            <p className="text-white font-semibold text-lg text-center">Receipt Capture</p>
            <p className="text-white/60 text-sm text-center leading-relaxed">
              Point your camera at a receipt and our AI will automatically extract the transaction details.
            </p>
            {cameraError && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-2xl px-4 py-3 w-full">
                <p className="text-red-300 text-xs text-center">{cameraError}</p>
              </div>
            )}
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Hidden gallery file input */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGalleryUpload}
      />

      {/* Controls — always: [red X cancel] [main action] [gallery] */}
      <div className="bg-black/80 px-8 py-6 pb-24 flex items-center justify-between">
        {/* Cancel — round red X */}
        <button
          onClick={() => { stopCamera(); navigate('/'); }}
          className="w-14 h-14 rounded-full bg-red-500/20 border-2 border-red-500/60 flex items-center justify-center active:scale-90 transition-transform"
        >
          <X size={22} className="text-red-400" />
        </button>

        {/* Center — shutter when active, start-camera when not */}
        {cameraActive ? (
          <button
            onClick={capturePhoto}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 rounded-full border-4 border-black/20 bg-white" />
          </button>
        ) : (
          <button
            onClick={startCamera}
            className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center shadow-2xl shadow-green-600/40 active:scale-95 transition-transform"
          >
            <Camera size={32} className="text-white" />
          </button>
        )}

        {/* Gallery — round */}
        <button
          onClick={() => galleryRef.current?.click()}
          className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center active:scale-90 transition-transform"
        >
          <ImageIcon size={20} className="text-white" />
        </button>
      </div>
    </div>
  );
}
