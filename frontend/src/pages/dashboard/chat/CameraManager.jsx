import React, { useRef, useEffect } from 'react';
import { Button } from '../../../components/ui';
import { Camera, X, RefreshCw } from 'lucide-react';

const CameraManager = ({ showCamera, stream, onStop, onCapture, onSwitch, videoDevices }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (showCamera && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [showCamera, stream]);

  if (!showCamera) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg aspect-[3/4] bg-gray-900 overflow-hidden shadow-2xl">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        
        {/* Camera Controls */}
        <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-8 md:gap-12">
          <Button 
            onClick={onStop}
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border-white/20 backdrop-blur-md"
          >
            <X className="w-6 h-6 text-white" />
          </Button>

          <button 
            onClick={onCapture}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl active:scale-90 transition-transform border-4 border-gray-300"
          >
            <div className="w-16 h-16 rounded-full border-2 border-gray-900/10" />
          </button>

          {videoDevices.length > 1 && (
            <Button 
              onClick={onSwitch}
              className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border-white/20 backdrop-blur-md"
            >
              <RefreshCw className="w-6 h-6 text-white" />
            </Button>
          )}
        </div>

        {/* Floating Title */}
        <div className="absolute top-6 left-0 right-0 text-center">
            <span className="bg-black/40 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-white/10">
                Escaneando Documento
            </span>
        </div>
      </div>
    </div>
  );
};

export default CameraManager;
