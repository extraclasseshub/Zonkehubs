import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImagePreviewModalProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  title?: string;
}

export default function ImagePreviewModal({ 
  images, 
  initialIndex, 
  onClose, 
  title = "Portfolio Images" 
}: ImagePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [rotation, setRotation] = useState(0);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case '+':
        case '=':
          setIsZoomed(true);
          break;
        case '-':
          setIsZoomed(false);
          break;
        case 'r':
        case 'R':
          setRotation(prev => (prev + 90) % 360);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const goToNext = () => {
    setImageLoading(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsZoomed(false);
    setRotation(0);
  };

  const goToPrevious = () => {
    setImageLoading(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsZoomed(false);
    setRotation(0);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(images[currentIndex]);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `portfolio-image-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3db2ff]/20 via-transparent to-[#00c9a7]/20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.02%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/90 via-black/60 to-transparent backdrop-blur-md">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-[#3db2ff] to-[#00c9a7] rounded-lg p-2">
              <div className="w-6 h-6 bg-white/20 rounded backdrop-blur-sm"></div>
            </div>
            <div>
              <h2 className="text-white text-lg sm:text-xl font-semibold">{title}</h2>
              <span className="text-white/70 text-sm">
                {currentIndex + 1} of {images.length}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Rotate Button */}
            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all backdrop-blur-sm border border-white/10 hover:border-white/20"
              title="Rotate image (R)"
            >
              <RotateCw className="h-5 w-5" />
            </button>
            
            {/* Zoom Controls */}
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all backdrop-blur-sm border border-white/10 hover:border-white/20"
              title={isZoomed ? "Zoom out (-)" : "Zoom in (+)"}
            >
              {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
            </button>
            
            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all backdrop-blur-sm border border-white/10 hover:border-white/20"
              title="Download image"
            >
              <Download className="h-5 w-5" />
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2.5 text-white/80 hover:text-white hover:bg-red-500/20 rounded-xl transition-all backdrop-blur-sm border border-white/10 hover:border-red-500/30"
              title="Close (Esc)"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Modern Navigation Chevrons */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 group"
            title="Previous image (←)"
          >
            <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-4 transition-all duration-300 group-hover:bg-black/60 group-hover:border-white/40 group-hover:scale-110 group-active:scale-95">
              <ChevronLeft className="h-8 w-8 text-white group-hover:text-[#3db2ff] transition-colors" />
            </div>
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 group"
            title="Next image (→)"
          >
            <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-4 transition-all duration-300 group-hover:bg-black/60 group-hover:border-white/40 group-hover:scale-110 group-active:scale-95">
              <ChevronRight className="h-8 w-8 text-white group-hover:text-[#00c9a7] transition-colors" />
            </div>
          </button>
        </>
      )}

      {/* Main Image Container */}
      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-20">
        {/* Loading Spinner */}
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-[#3db2ff] border-r-[#00c9a7] absolute top-0 left-0"></div>
            </div>
          </div>
        )}
        
        {/* Main Image */}
        <div className="relative max-w-full max-h-full">
          <img
            src={images[currentIndex]}
            alt={`Portfolio image ${currentIndex + 1}`}
            onLoad={handleImageLoad}
            className={`
              max-w-full max-h-full object-contain transition-all duration-500 cursor-pointer
              shadow-2xl rounded-lg
              ${isZoomed ? 'scale-150 cursor-grab active:cursor-grabbing' : 'hover:scale-105'}
              ${imageLoading ? 'opacity-0' : 'opacity-100'}
            `}
            style={{ 
              transform: `rotate(${rotation}deg) ${isZoomed ? 'scale(1.5)' : 'scale(1)'}`,
              filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5))'
            }}
            onClick={() => setIsZoomed(!isZoomed)}
            draggable={false}
          />
        </div>
      </div>

      {/* Modern Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent backdrop-blur-md">
          <div className="flex justify-center p-4 sm:p-6">
            <div className="flex space-x-3 overflow-x-auto max-w-full pb-2 scrollbar-hide">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setImageLoading(true);
                    setIsZoomed(false);
                    setRotation(0);
                  }}
                  className={`
                    relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden transition-all duration-300
                    ${index === currentIndex 
                      ? 'ring-2 ring-[#3db2ff] shadow-lg shadow-[#3db2ff]/25 scale-110' 
                      : 'ring-1 ring-white/20 hover:ring-white/40 hover:scale-105'
                    }
                  `}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === currentIndex && (
                    <div className="absolute inset-0 bg-gradient-to-t from-[#3db2ff]/20 to-transparent"></div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded backdrop-blur-sm">
                    {index + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
      />

      {/* Modern Keyboard shortcuts hint */}
      <div className="absolute bottom-4 left-4 text-white/50 text-xs hidden sm:block bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs">←</kbd>
            <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs">→</kbd>
            <span>Navigate</span>
          </span>
          <span className="flex items-center space-x-1">
            <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs">Esc</kbd>
            <span>Close</span>
          </span>
          <span className="flex items-center space-x-1">
            <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs">R</kbd>
            <span>Rotate</span>
          </span>
        </div>
      </div>

      {/* Progress indicator */}
      {images.length > 1 && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex space-x-2">
            {images.map((_, index) => (
              <div
                key={index}
                className={`
                  h-1 rounded-full transition-all duration-300
                  ${index === currentIndex 
                    ? 'w-8 bg-gradient-to-r from-[#3db2ff] to-[#00c9a7]' 
                    : 'w-2 bg-white/30'
                  }
                `}
              />
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
</parameter>