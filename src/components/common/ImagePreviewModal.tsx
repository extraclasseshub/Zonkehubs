import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';

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
  };

  const goToPrevious = () => {
    setImageLoading(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsZoomed(false);
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
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-white text-lg sm:text-xl font-semibold">{title}</h2>
            <span className="text-white/70 text-sm">
              {currentIndex + 1} of {images.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
              title={isZoomed ? "Zoom out" : "Zoom in"}
            >
              {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
            </button>
            
            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
              title="Download image"
            >
              <Download className="h-5 w-5" />
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
              title="Close (Esc)"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all backdrop-blur-sm"
            title="Previous image (←)"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all backdrop-blur-sm"
            title="Next image (→)"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      {/* Main Image Container */}
      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-16">
        {/* Loading Spinner */}
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
        
        {/* Main Image */}
        <img
          src={images[currentIndex]}
          alt={`Portfolio image ${currentIndex + 1}`}
          onLoad={handleImageLoad}
          className={`
            max-w-full max-h-full object-contain transition-all duration-300 cursor-pointer
            ${isZoomed ? 'scale-150 cursor-grab active:cursor-grabbing' : 'hover:scale-105'}
            ${imageLoading ? 'opacity-0' : 'opacity-100'}
          `}
          onClick={() => setIsZoomed(!isZoomed)}
          draggable={false}
        />
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6">
          <div className="flex justify-center">
            <div className="flex space-x-2 overflow-x-auto max-w-full pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setImageLoading(true);
                    setIsZoomed(false);
                  }}
                  className={`
                    flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all
                    ${index === currentIndex 
                      ? 'border-white shadow-lg scale-110' 
                      : 'border-white/30 hover:border-white/60 hover:scale-105'
                    }
                  `}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
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

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-4 left-4 text-white/50 text-xs hidden sm:block">
        <p>Use ← → to navigate • Esc to close • Click image to zoom</p>
      </div>
    </div>
  );
}