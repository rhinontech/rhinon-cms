// Star Rating Component - for feedback forms
import React, { useState } from 'react';
import { Star } from 'lucide-react';

export interface StarRatingProps {
  name: string;
  required?: boolean;
  onChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  name,
  required = false,
  onChange,
}) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  const handleClick = (value: number) => {
    setRating(value);
    onChange?.(value);
  };

  return (
    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
      <input type='hidden' name={name} value={rating} required={required} />
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type='button'
          onClick={() => handleClick(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            transition: 'transform 0.1s ease',
            transform: hover === star ? 'scale(1.2)' : 'scale(1)',
          }}
        >
          <Star
            size={28}
            fill={(hover || rating) >= star ? '#fbbf24' : 'none'}
            color={(hover || rating) >= star ? '#fbbf24' : '#d1d5db'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
