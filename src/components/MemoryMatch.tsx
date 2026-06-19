"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";

interface MemoryMatchProps {
  images: { id: string; src: string; caption: string }[];
  onClose: () => void;
}

interface Card {
  id: string; // unique instance id
  imageId: string;
  src: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryMatch({ images, onClose }: MemoryMatchProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    // Select up to 8 unique images, or double up if not enough
    const selectedImages = [...images].slice(0, 8);
    while (selectedImages.length < 8 && selectedImages.length > 0) {
      selectedImages.push(selectedImages[0]); // fallback if very few images
    }

    // Create pairs
    const pairs = [...selectedImages, ...selectedImages].map((img, i) => ({
      id: `card-${i}`,
      imageId: img.id,
      src: img.src,
      isFlipped: false,
      isMatched: false,
    }));

    // Shuffle
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }

    setCards(pairs);
  }, [images]);

  const handleCardClick = (index: number) => {
    // Ignore clicks if already flipped or 2 cards are currently flipping
    if (cards[index].isFlipped || cards[index].isMatched || flippedCards.length === 2) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      const [firstIndex, secondIndex] = newFlipped;
      
      if (newCards[firstIndex].imageId === newCards[secondIndex].imageId) {
        // Match!
        setTimeout(() => {
          setCards(prev => {
            const matched = [...prev];
            matched[firstIndex].isMatched = true;
            matched[secondIndex].isMatched = true;
            
            if (matched.every(c => c.isMatched)) {
              setIsWon(true);
            }
            return matched;
          });
          setFlippedCards([]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => {
            const unmatched = [...prev];
            unmatched[firstIndex].isFlipped = false;
            unmatched[secondIndex].isFlipped = false;
            return unmatched;
          });
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (isWon) {
      setTimeout(() => setShowReward(true), 1500);
    }
  }, [isWon]);

  return (
    <div className="absolute inset-0 z-50 bg-cream/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-rose/20 text-rose-deep flex items-center justify-center font-bold"
      >
        ✕
      </button>

      {!showReward ? (
        <div className="w-full max-w-xl">
          <div className="text-center mb-6">
            <h2 className="text-3xl text-rose-deep mb-2" style={{ fontFamily: "var(--font-heading)" }}>Memory Match</h2>
            <p className="text-ink-faint text-sm">Moves: {moves}</p>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-4 aspect-square">
            {cards.map((card, index) => (
              <div 
                key={card.id}
                onClick={() => handleCardClick(index)}
                className="relative cursor-pointer aspect-[3/4] book-perspective"
              >
                <div 
                  className="w-full h-full page-3d transition-transform duration-500 rounded shadow-md border border-gold/30"
                  style={{ transform: card.isFlipped || card.isMatched ? "rotateY(180deg)" : "rotateY(0deg)" }}
                >
                  {/* Front (Back of card visually) */}
                  <div className="absolute inset-0 page-front bg-rose-dark rounded flex items-center justify-center border-2 border-gold-light">
                    <span className="text-gold-light text-2xl">✨</span>
                  </div>
                  
                  {/* Back (Image visually) */}
                  <div className="absolute inset-0 page-back bg-cream rounded overflow-hidden">
                    <Image
                      src={card.src}
                      alt="Memory card"
                      fill
                      className={`object-cover ${card.isMatched ? "opacity-60" : ""}`}
                      unoptimized
                    />
                    {card.isMatched && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl">❤️</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md glass-card rounded-xl p-8 text-center animate-fade-in-up">
          <h2 className="text-3xl text-rose-deep mb-4" style={{ fontFamily: "var(--font-heading)" }}>You Did It!</h2>
          <div className="text-5xl mb-6">💌</div>
          <p className="text-ink text-lg leading-relaxed mb-6" style={{ fontFamily: "var(--font-handwriting)", fontSize: '1.5rem' }}>
            My dearest, <br/>
            You found all the pieces of our story. <br/>
            No matter how scrambled life gets, we will always find our way back to each other.
          </p>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-rose text-white rounded-full font-semibold hover:bg-rose-deep transition-colors"
          >
            Keep Exploring
          </button>
        </div>
      )}
    </div>
  );
}
