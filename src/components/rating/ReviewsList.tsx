import React, { useState } from 'react';
import { Rating } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Star, User, Calendar, Trash2, AlertCircle, Loader2 } from 'lucide-react';

interface ReviewsListProps {
  ratings: Rating[];
  maxReviews?: number;
  onRatingDeleted?: () => void;
}

export default function ReviewsList({ ratings, maxReviews = 10, onRatingDeleted }: ReviewsListProps) {
  const { user, deleteRating } = useAuth();
  const [deletingRatingId, setDeletingRatingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  const displayedRatings = maxReviews ? ratings.slice(0, maxReviews) : ratings;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-400'
        }`}
      />
    ));
  };

  const handleDeleteRating = async (ratingId: string) => {
    if (!user) return;
    
    setDeletingRatingId(ratingId);
    try {
      console.log('🗑️ Deleting rating:', ratingId);
      const success = await deleteRating(ratingId);
      
      if (success) {
        console.log('✅ Rating deleted successfully');
        setShowDeleteConfirm(null);
        if (onRatingDeleted) {
          onRatingDeleted();
        }
      } else {
        console.error('❌ Failed to delete rating');
        alert('Failed to delete review. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error deleting rating:', error);
      alert('An error occurred while deleting the review.');
    } finally {
      setDeletingRatingId(null);
    }
  };

  if (ratings.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-slate-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Star className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Reviews Yet</h3>
        <p className="text-[#cbd5e1] mb-4">Be the first to leave a review for this provider!</p>
        <div className="text-sm text-[#cbd5e1] bg-slate-700 rounded-lg p-4 max-w-md mx-auto">
          <p className="mb-2">💡 <strong>How reviews work:</strong></p>
          <div className="space-y-1 text-left">
            <p>• Rate providers from 1 to 5 stars</p>
            <p>• Write detailed reviews about your experience</p>
            <p>• Help other users find quality service providers</p>
            <p>• Reviews are visible to all users immediately</p>
            <p>• You can edit or delete your own reviews</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 p-4 bg-slate-700 rounded-lg border border-slate-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1) : '0.0'}
              </div>
              <div className="flex space-x-1 justify-center mb-1">
                {renderStars(Math.round(ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length))}
              </div>
              <div className="text-xs text-[#cbd5e1]">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#3db2ff]">{ratings.length}</div>
              <div className="text-xs text-[#cbd5e1]">Total Reviews</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-[#cbd5e1] space-y-1">
              {[5, 4, 3, 2, 1].map(stars => {
                const count = ratings.filter(r => r.rating === stars).length;
                const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center space-x-2">
                    <span className="text-xs w-6">{stars}★</span>
                    <div className="w-20 h-2 bg-slate-600 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {displayedRatings.map((rating) => {
        const isOwnReview = user && user.id === rating.userId;
        
        return (
          <div key={rating.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#3db2ff] to-[#00c9a7] flex items-center justify-center border-2 border-slate-500">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-white font-medium">{rating.userName}</p>
                    {isOwnReview && (
                      <span className="bg-[#3db2ff] text-white text-xs px-2 py-1 rounded-full">
                        Your Review
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex space-x-1">
                      {renderStars(rating.rating)}
                    </div>
                    <span className="text-sm font-semibold text-yellow-400">
                      {rating.rating}.0
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(rating.timestamp)}</span>
                </div>
                {isOwnReview && (
                  <div className="flex items-center space-x-1">
                    {showDeleteConfirm === rating.id ? (
                      <div className="flex items-center space-x-2 bg-red-900/20 border border-red-600 rounded-md p-2">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <span className="text-xs text-red-400">Delete?</span>
                        <button
                          onClick={() => handleDeleteRating(rating.id)}
                          disabled={deletingRatingId === rating.id}
                          className="text-red-400 hover:text-red-300 text-xs font-medium disabled:opacity-50"
                        >
                          {deletingRatingId === rating.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Yes'
                          )}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          disabled={deletingRatingId === rating.id}
                          className="text-gray-400 hover:text-gray-300 text-xs font-medium disabled:opacity-50"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeleteConfirm(rating.id)}
                        disabled={deletingRatingId !== null}
                        className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded disabled:opacity-50"
                        title="Delete your review"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {rating.review && rating.review.trim() && (
              <div className="mt-3 pl-13">
                <div className="bg-slate-600 rounded-lg p-3 border-l-4 border-[#3db2ff]">
                  <p className="text-[#cbd5e1] leading-relaxed text-sm">{rating.review}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
      
      {ratings.length > maxReviews && (
        <div className="text-center py-4">
          <p className="text-sm text-[#cbd5e1]">
            Showing {maxReviews} of {ratings.length} reviews
          </p>
          <button className="mt-2 text-[#3db2ff] hover:text-blue-400 text-sm font-medium">
            View All Reviews
          </button>
        </div>
      )}
    </div>
  );
}