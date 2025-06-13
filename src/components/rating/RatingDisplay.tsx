import React from 'react';
import { Star } from 'lucide-react';

interface RatingDisplayProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export default function RatingDisplay({ 
  rating, 
  reviewCount, 
  size = 'md', 
  showCount = true,
  className = '' 
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isFullStar = starValue <= Math.floor(rating);
      const isHalfStar = starValue === Math.ceil(rating) && rating % 1 !== 0;
      
      return (
        <div key={index} className="relative">
          <Star 
            className={`${sizeClasses[size]} ${
              isFullStar ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
          {isHalfStar && (
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star 
                className={`${sizeClasses[size]} text-yellow-400 fill-current`}
              />
            </div>
          )}
        </div>
      );
    });
  };

  // Show "No reviews yet" only if rating is 0 AND reviewCount is 0 or undefined
  const hasNoReviews = (!rating || rating === 0) && (!reviewCount || reviewCount === 0);

  if (hasNoReviews) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className="flex space-x-1">
          {Array.from({ length: 5 }, (_, index) => (
            <Star key={index} className={`${sizeClasses[size]} text-gray-400`} />
          ))}
        </div>
        <span className={`text-gray-400 ${textSizeClasses[size]}`}>
          No reviews yet
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <div className="flex space-x-1">
          {renderStars()}
        </div>
        <span className={`font-semibold text-white ${textSizeClasses[size]}`}>
          {rating ? rating.toFixed(1) : '0.0'}
        </span>
      </div>
      {showCount && reviewCount && reviewCount > 0 && (
        <span className={`text-gray-400 ${textSizeClasses[size]}`}>
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}