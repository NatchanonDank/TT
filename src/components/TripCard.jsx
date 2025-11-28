import React, { useState, useEffect } from 'react';
import { Users, Star, Trash2 } from 'lucide-react'; 
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './TripCard.css';

const TripCard = ({ trip, onClick, onDelete, currentUser }) => { 
  const [authorRating, setAuthorRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const isOwner = currentUser?.uid === (trip.author?.uid || trip.uid);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  useEffect(() => {
    const fetchAuthorRating = async () => {
      const authorId = trip.author?.uid || trip.uid;
      if (!authorId) return;
      try {
        const q = query(collection(db, 'friend_reviews'), where('targetUserId', '==', authorId));
        const querySnapshot = await getDocs(q);
        const reviews = querySnapshot.docs.map(doc => doc.data());
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
          setAuthorRating(totalRating / reviews.length);
          setReviewCount(reviews.length);
        } else { setAuthorRating(0); setReviewCount(0); }
      } catch (error) { console.error("Error fetching rating:", error); }
    };
    fetchAuthorRating();
  }, [trip]);

  const handleDeleteClick = (e) => {
    e.stopPropagation(); 
    onDelete(trip.id);
  };

  return (
    <div className="trip-card" onClick={onClick}>
      <div className="trip-card-image-wrapper">
        <img 
          src={trip.imageUrl || trip.images?.[0] || 'https://www.ktc.co.th/pub/media/Article/01/wooden-bridge-island-surat-thani-thailand.webp'} 
          alt={trip.title || trip.destination} 
          className="trip-card-image" 
        />
        {trip.isHot && <span className="trip-badge">🔥 HOT</span>}
        
        {isOwner && (
          <button className="trip-card-delete-btn" onClick={handleDeleteClick}>
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <div className="trip-card-content">
        <div className="trip-location">{trip.destination || 'ไทย'}</div>
        <h3 className="trip-title">{trip.title || trip.content?.substring(0, 50)}</h3>
        {trip.startDate && trip.endDate && (
          <div className="trip-dates">
            <div className="date-details">
              <div className="date-row"><span className="date-label">เริ่ม</span><span className="date-value">{formatDate(trip.startDate)}</span></div>
              <div className="date-row"><span className="date-label">สิ้นสุด</span><span className="date-value">{formatDate(trip.endDate)}</span></div>
            </div>
          </div>
        )}
        <div className="trip-meta">
          <div className="trip-members"><Users size={16} /><span>{trip.membersCount || 0} คน</span></div>
          <div className="trip-rating" style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
            <Star size={14} fill={authorRating > 0 ? "#FFD700" : "none"} color={authorRating > 0 ? "#FFD700" : "#999"} />
            <span>{authorRating > 0 ? authorRating.toFixed(1) : 'New'} {reviewCount > 0 && <span style={{fontSize: '10px', color: '#888', marginLeft: '2px'}}> ({reviewCount})</span>}</span>
          </div>
        </div>
        <div className="trip-author"><span className="author-label">จัดโดย </span><span className="author-name">{trip.author?.name || 'ผู้ใช้'}</span></div>
      </div>
    </div>
  );
};

export default TripCard;