import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import './TicketRating.scss';

export default function TicketRating({
  name,
  required,
  value,
  handleSubmitRating,
}: {
  name: string;
  required: boolean;
  handleSubmitRating: (value: number) => void;
  value: number | null;
}) {
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);

  // Sync with incoming value
  useEffect(() => {
    if (value != null) {
      setRating(value);
    }
  }, [value]);

  return (
    <div className='star-rating'>
      {Array.from({ length: 5 }, (_, i) => {
        const starValue = i + 1;
        return (
          <button
            type='button'
            key={starValue}
            className='star-button'
            onClick={() => {
              setRating(starValue);
              handleSubmitRating(starValue);
            }}
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(0)}
          >
            <Star
              className={`ticket-star-icon ${
                starValue <= (hover || rating) ? 'active' : 'inactive'
              }`}
            />
          </button>
        );
      })}

      {/* Hidden input so FormData picks it up */}
      <input type='hidden' name={name} value={rating} required={required} />
    </div>
  );
}
