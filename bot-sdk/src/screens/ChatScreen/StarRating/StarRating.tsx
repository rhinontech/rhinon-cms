import React, { useState } from "react";
import { Star } from "lucide-react";
import './StarRating.scss';

export default function StarRating({ name, required }: { name: string, required:boolean }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  return (
    <div className="star-rating">
      {Array.from({ length: 5 }, (_, i) => {
        const starValue = i + 1;
        return (
          <button
            type="button"
            key={starValue}
            className="star-button"
            onClick={() => setRating(starValue)}
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(0)}
          >
            <Star
              className={`star-icon ${
                starValue <= (hover || rating) ? "active" : "inactive"
              }`}
            />
          </button>
        );
      })}

      {/* Hidden input so FormData picks it up */}
      <input type="hidden" name={name} value={rating} required={required} />
    </div>
  );
}
