import React from 'react';
import { motion } from 'framer-motion';
import { Shuffle } from 'lucide-react';
import { CardType } from '../types';

interface CardProps {
  card: CardType;
  onClick: (card: CardType) => void;
  disabled: boolean;
}

export const Card: React.FC<CardProps> = ({ card, onClick, disabled }) => {
  return (
    <motion.div
      layout
      className="aspect-[3/4] cursor-pointer relative"
      onClick={() => !disabled && onClick(card)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ layout: { type: "spring", stiffness: 300, damping: 30 } }}
      style={{ perspective: 1000 }} 
    >
      <motion.div
        className="w-full h-full relative preserve-3d transition-transform duration-500"
        animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Card Back (Face Down) - Shows Game Logo */}
        <div 
          className="absolute inset-0 backface-hidden rounded-xl bg-orange-500 border-4 border-orange-600 border-b-[6px] flex flex-col items-center justify-center p-2 box-border"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="bg-orange-400/50 p-2 rounded-full mb-1">
              <Shuffle className="w-8 h-8 text-white" strokeWidth={3} />
            </div>
            <span className="text-white font-black text-xs tracking-widest opacity-90">CAOS</span>
          </div>
        </div>

        {/* Card Front (Face Up) - Shows Content */}
        <div 
          className="absolute inset-0 backface-hidden rounded-xl bg-white border-4 border-slate-200 border-b-[6px] flex items-center justify-center box-border"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="text-5xl select-none filter drop-shadow-none">{card.emoji}</span>
          {card.isMatched && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }} 
              animate={{ scale: 1.2, opacity: 1 }} 
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="text-green-500 font-black text-6xl opacity-40">✓</div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};