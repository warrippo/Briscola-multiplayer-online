import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Card, Suit } from '../types';
import { RANK_INFO, SUITS } from '../utils/briscola';

interface CardViewProps {
  card?: Card | null;
  faceDown?: boolean;
  onClick?: () => void;
  isPlayable?: boolean;
  isSelected?: boolean;
  isBriscola?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  id?: string;
}

const suitColors: Record<Suit, { bg: string; text: string; border: string; accent: string }> = {
  denari: {
    bg: 'from-amber-50 to-yellow-100',
    text: 'text-amber-800',
    border: 'border-amber-400',
    accent: 'bg-amber-500',
  },
  coppe: {
    bg: 'from-red-50 to-rose-100',
    text: 'text-red-900',
    border: 'border-red-400',
    accent: 'bg-red-500',
  },
  bastoni: {
    bg: 'from-emerald-50 to-green-100',
    text: 'text-emerald-950',
    border: 'border-emerald-500',
    accent: 'bg-emerald-600',
  },
  spade: {
    bg: 'from-slate-50 to-blue-100',
    text: 'text-blue-950',
    border: 'border-blue-400',
    accent: 'bg-blue-600',
  },
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  faceDown = false,
  onClick,
  isPlayable = false,
  isSelected = false,
  isBriscola = false,
  size = 'md',
  className = '',
  id,
}) => {
  const [imgError, setImgError] = useState(false);
  const [backError, setBackError] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-20 rounded-md',
    md: 'w-20 h-32 rounded-lg',
    lg: 'w-28 h-44 rounded-xl',
    xl: 'w-36 h-56 rounded-2xl',
  };

  if (faceDown || !card) {
    return (
      <motion.div
        id={id}
        whileHover={onClick ? { scale: 1.05, y: -4 } : {}}
        onClick={onClick}
        className={`${sizeClasses[size]} bg-zinc-900 border-2 border-zinc-700 shadow-xl flex items-center justify-center relative cursor-pointer overflow-hidden ${className}`}
      >
        {!backError ? (
          <img
            src="/cards/piacentine/back.jpg"
            alt="Dorso Carta"
            className="w-full h-full object-cover rounded-md"
            loading="eager"
            onError={() => setBackError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-900 to-zinc-950 flex flex-col items-center justify-center border-2 border-emerald-500/30 p-2">
            <span className="text-2xl">🎴</span>
          </div>
        )}
      </motion.div>
    );
  }

  const imagePath = `/cards/piacentine/${card.suit}_${card.rank}.jpg`;
  const suitObj = SUITS.find((s) => s.id === card.suit) || SUITS[0];
  const rankObj = RANK_INFO[card.rank];
  const color = suitColors[card.suit];

  return (
    <motion.div
      id={id}
      whileHover={isPlayable ? { scale: 1.08, y: -10 } : {}}
      whileTap={isPlayable ? { scale: 0.96 } : {}}
      animate={isSelected ? { y: -16, scale: 1.06 } : { y: 0 }}
      onClick={isPlayable ? onClick : undefined}
      className={`${sizeClasses[size]} relative select-none rounded-lg overflow-hidden border-2 shadow-xl transition-shadow bg-zinc-900 ${
        isPlayable
          ? 'cursor-pointer hover:shadow-emerald-500/50 ring-2 ring-emerald-400 border-emerald-400'
          : 'border-zinc-400/60'
      } ${isSelected ? 'ring-4 ring-emerald-400 shadow-emerald-500/60' : ''} ${
        isBriscola ? 'ring-2 ring-amber-400 border-amber-400 shadow-amber-500/40' : ''
      } ${className}`}
    >
      {/* Real Card JPG Image with fallback */}
      {!imgError ? (
        <img
          src={imagePath}
          alt={card.name}
          className="w-full h-full object-cover"
          loading="eager"
          onError={(e) => {
            // Fallback to /cards/
            const target = e.currentTarget;
            if (!target.src.includes('/cards/napoletane/')) {
              target.src = `/cards/napoletane/${card.suit}_${card.rank}.jpg`;
            } else {
              setImgError(true);
            }
          }}
        />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${color.bg} ${color.border} flex flex-col justify-between p-1.5`}>
          <div className="flex justify-between items-start leading-none">
            <span className={`font-black font-mono ${color.text}`}>{rankObj?.shortName}</span>
            <span className="text-xs">{suitObj?.symbol}</span>
          </div>
          <div className="text-center">
            <span className="text-2xl">{suitObj?.symbol}</span>
          </div>
          <div className="flex justify-between items-end leading-none rotate-180">
            <span className={`font-black font-mono ${color.text}`}>{rankObj?.shortName}</span>
            <span className="text-xs">{suitObj?.symbol}</span>
          </div>
        </div>
      )}

      {/* Points Badge Overlay */}
      {card.points > 0 && (
        <div className="absolute top-1 right-1 bg-emerald-600/90 backdrop-blur-xs text-white font-black font-mono px-1.5 py-0.5 rounded text-[10px] shadow-md border border-emerald-400/50 pointer-events-none">
          +{card.points}p
        </div>
      )}

      {/* Briscola Badge Overlay */}
      {isBriscola && (
        <div className="absolute bottom-1 left-1 bg-amber-500 text-zinc-950 text-[9px] font-black uppercase font-mono px-1 rounded shadow-md border border-amber-300 pointer-events-none">
          BRISCOLA
        </div>
      )}
    </motion.div>
  );
};
