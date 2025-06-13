import React, { useState } from 'react';
import { ServiceProvider, Rating } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { X, Star, Send, Loader2, User, AlertCircle, CheckCircle } from 'lucide-react';

interface RatingModalProps {
  provider: ServiceProvider;
  onClose: () => void;
  onRatingSubmitted: () => void;
}

export default function RatingModal({ provider, onClose, onRatingSubmitted }: RatingModalProps) {
  const { user, rateProvider, getUserRating } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingRating, setExistingRating] = useState<Rating | undefined>();

  // Load existing rating
  React.useEffect(() => {
    const loadExistingRating = async () => {
      if (user) {
        try {
          const existing = await getUserRating(user.id, provider.id);
          setExistingRating(existing);
          if (existing) {
            setRating(existing.rating);
            setReview(existing.review || '');
          }
        } catch (error) {
          console.error('Error loading existing rating:', error);
        }
      }
    };
    loadExistingRating();
  }, [user, provider.id, getUserRating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('🌟 Submitting rating:', { providerId: provider.id, rating, review });
      const success = await rateProvider(provider.id, rating, review);
      if (success) {
        console.log('✅ Rating submitted successfully');
        setSuccess('Rating submitted successfully!');
        
        // Wait a moment to show success message, then close and trigger refresh
        setTimeout(() => {
          onRatingSubmitted();
          onClose();
        }, 2000);
      } else {
        setError('Failed to submit rating. Please try again.');
      }
    } catch (error) {
      console.error('Rating submission failed:', error);
      setError('Failed to submit rating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isActive = starValue <= (hoverRating || rating);
      
      return (
        <button
          key={index}
          type="button"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
          disabled={loading}
          className={`transition-all duration-200 transform hover:scale-110 disabled:cursor-not-allowed ${
            isActive ? 'text-yellow-400' : 'text-gray-400'
          }`}
        >
          <Star 
            className={`h-8 w-8 ${isActive ? 'fill-current' : ''}`} 
          />
        </button>
      );
    });
  };

  const getRatingText = (stars: number) => {
    const texts = {
      1: 'Poor',
      2: 'Fair', 
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return texts[stars as keyof typeof texts] || '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">
            {existingRating ? 'Update Your Rating' : 'Rate Service Provider'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors disabled:cursor-not-allowed"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Provider Info */}
          <div className="flex items-center space-x-3">
            {provider.profileImage ? (
              <img
                src={provider.profileImage}
                alt={provider.businessName || provider.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-[#3db2ff]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                <User className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="text-white font-semibold">
                {provider.businessName || provider.name}
              </h3>
              <p className="text-sm text-[#3db2ff]">{provider.serviceType}</p>
            </div>
          </div>

          {/* Star Rating */}
          <div className="text-center">
            <label className="block text-sm font-medium text-[#cbd5e1] mb-4">
              How would you rate this service provider?
            </label>
            <div className="flex justify-center space-x-2 mb-2">
              {renderStars()}
            </div>
            {(hoverRating || rating) > 0 && (
              <p className="text-sm text-[#3db2ff] font-medium">
                {getRatingText(hoverRating || rating)}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div>
            <label htmlFor="review" className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Write a review (optional)
            </label>
            <textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              disabled={loading}
              rows={4}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Share your experience with this service provider..."
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1">
              {review.length}/500 characters
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="flex items-center space-x-2 text-green-400 text-sm bg-green-900/20 border border-green-600 rounded-md p-3">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 text-red-400 text-sm bg-red-900/20 border border-red-600 rounded-md p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rating === 0 || loading}
              className="flex-1 bg-gradient-to-r from-[#3db2ff] to-[#00c9a7] hover:from-[#2563eb] hover:to-[#059669] disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-all flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {existingRating ? 'Update Rating' : 'Submit Rating'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}