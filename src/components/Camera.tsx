import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
  instruction?: string;
}

const Camera: React.FC<CameraProps> = ({ onCapture, onClose, instruction }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("Không thể truy cập camera. Vui lòng cấp quyền.");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageSrc);
      }
    }
  }, [onCapture]);

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
        <p className="text-white text-lg mb-4 text-center">{error}</p>
        <button onClick={onClose} className="px-6 py-2 bg-white text-black rounded-full font-medium">
          Đóng
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={onClose} className="text-white p-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-white font-medium">Chấm công khuôn mặt</h3>
        <div className="w-8"></div>
      </div>

      {/* Video Viewport */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-gray-900">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute min-w-full min-h-full object-cover"
        />
        {/* Face Guide Overlay */}
        <div className="relative z-10 w-64 h-80 border-2 border-white/50 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-8 w-max">
                <span className="text-white text-sm font-medium drop-shadow-md bg-black/30 px-3 py-1 rounded-full">
                  {instruction || "Đặt khuôn mặt vào khung hình"}
                </span>
             </div>
             {/* Scanning Animation */}
             <div className="absolute top-0 left-0 right-0 h-1 bg-brand-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
        </div>
      </div>

      {/* Capture Controls */}
      <div className="h-32 bg-black flex items-center justify-center pb-8 pt-4">
        <button
          onClick={handleCapture}
          className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-brand-600"></div>
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Camera;