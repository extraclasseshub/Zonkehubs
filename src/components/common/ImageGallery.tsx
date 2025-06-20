import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, Download } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  initialIndex?: number;
  onClose?: () => void;
  showThumbnails?: boolean;
  className?: string;
}

export default function ImageGallery({ 
  images, 
  initialIndex = 0, 
  onClose, 
  showThumbnails = true,
  className = '' 
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsLoading(true);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsLoading(true);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
    setIsLoading(true);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'Escape') {
      if (isFullscreen) {
        setIsFullscreen(false);
      } else if (onClose) {
        onClose();
      }
    }
  };

  useEffect(() => {
    if (isFullscreen || onClose) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isFullscreen, onClose]);

  const downloadImage = async () => {
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
      console.error('Failed to download image:', error);
    }
  };

  if (images.length === 0) return null;

  const FullscreenGallery = () => (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {/* Close Button */}
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Download Button */}
        <button
          onClick={downloadImage}
          className="absolute top-4 right-16 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
        >
          <Download className="h-6 w-6" />
        </button>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </>
        )}

        {/* Main Image */}
        <div className="relative max-w-full max-h-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}
          <img
            src={images[currentIndex]}
            alt={`Portfolio image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          />
        </div>

        {/* Image Counter */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Thumbnails */}
        {showThumbnails && images.length > 1 && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2 max-w-full overflow-x-auto px-4">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex 
                    ? 'border-white scale-110' 
                    : 'border-transparent hover:border-gray-400'
                }`}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Main Image Display */}
        <div className="relative group">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-700 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3db2ff]"></div>
            </div>
          )}
          
          <img
            src={images[currentIndex]}
            alt={`Portfolio image ${currentIndex + 1}`}
            className="w-full h-full object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
            onClick={() => setIsFullscreen(true)}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          />

          {/* Overlay with controls */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              onClick={() => setIsFullscreen(true)}
              className="bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full transition-colors"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation arrows for multiple images */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
              {currentIndex + 1}/{images.length}
            </div>
          )}
        </div>

        {/* Thumbnail navigation */}
        {showThumbnails && images.length > 1 && (
          <div className="flex space-x-2 mt-3 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                  index === currentIndex 
                    ? 'border-[#3db2ff] scale-110' 
                    : 'border-slate-600 hover:border-slate-400'
                }`}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Gallery */}
      {isFullscreen && <FullscreenGallery />}
    </>
  );
}