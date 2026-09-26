"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

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

const DEFAULT_GAME_IMAGES = [
  { id: "def-1", src: "/images/storybook_cover.png", caption: "Cover" },
  { id: "def-2", src: "/images/enchanted_forest.png", caption: "Forest" },
  { id: "def-3", src: "/images/storybook_castle.png", caption: "Castle" },
  { id: "def-4", src: "/images/storybook_timeline.png", caption: "Timeline" },
  { id: "def-5", src: "/images/love_letter.png", caption: "Letter" },
  { id: "def-6", src: "/images/password_bg.png", caption: "Magic" },
  { id: "def-7", src: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?auto=format&fit=crop&q=80&w=600", caption: "Rose" },
  { id: "def-8", src: "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&q=80&w=600", caption: "Blossom" },
];

function createGameCards(images: { id: string; src: string; caption: string }[]): Card[] {
  const pool = (images && images.length > 0) ? [...images] : DEFAULT_GAME_IMAGES;
  const uniqueImages = pool.slice(0, 8);
  while (uniqueImages.length < 8) {
    uniqueImages.push(DEFAULT_GAME_IMAGES[uniqueImages.length % DEFAULT_GAME_IMAGES.length]);
  }

  // Create unique pairs so each card matches strictly with its intended twin
  const pairs: Card[] = [];
  uniqueImages.forEach((img, idx) => {
    const pairKey = `pair-${idx}-${img.id}`;
    pairs.push({
      id: `card-${idx}-a`,
      imageId: pairKey,
      src: img.src,
      isFlipped: false,
      isMatched: false,
    });
    pairs.push({
      id: `card-${idx}-b`,
      imageId: pairKey,
      src: img.src,
      isFlipped: false,
      isMatched: false,
    });
  });

  // Shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  return pairs;
}

export default function MemoryMatch({ images, onClose }: MemoryMatchProps) {
  const [cards, setCards] = useState<Card[]>(() => createGameCards(images));
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [showReward, setShowReward] = useState(false);

  const resetGame = () => {
    setCards(createGameCards(images));
    setFlippedCards([]);
    setMoves(0);
    setIsWon(false);
    setShowReward(false);
  };

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
          <div className="flex justify-center gap-4">
            <button 
              onClick={resetGame}
              className="px-6 py-2 bg-gold text-white rounded-full font-semibold hover:bg-gold-dark transition-colors"
            >
              Play Again
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-rose text-white rounded-full font-semibold hover:bg-rose-deep transition-colors"
            >
              Keep Exploring
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
