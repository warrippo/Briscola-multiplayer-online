import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, Sparkles } from 'lucide-react';
import { SUITS, ALL_RANKS, RANK_INFO } from '../utils/briscola';
import { Suit, Rank } from '../types';

interface DeckGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeckGalleryModal: React.FC<DeckGalleryModalProps> = ({ isOpen, onClose }) => {
  const [selectedSuit, setSelectedSuit] = useState<Suit | 'all'>('all');
  const [previewCard, setPreviewCard] = useState<{ suit: Suit; rank: Rank } | null>(null);

  if (!isOpen) return null;

  const suitsToDisplay = selectedSuit === 'all' ? SUITS : SUITS.filter((s) => s.id === selectedSuit);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-900 border-2 border-zinc-800 rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                Mazzo Carte Piacentine (40 Carte)
              </h2>
              <p className="text-xs text-zinc-400 font-medium">
                Tutte le 40 immagini JPG estratte ad alta risoluzione
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-2xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suit Filter Tabs */}
        <div className="flex gap-2 my-4 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedSuit('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition shrink-0 cursor-pointer ${
              selectedSuit === 'all'
                ? 'bg-emerald-500 text-zinc-950 shadow-lg'
                : 'bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            Tutte (40)
          </button>
          {SUITS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSuit(s.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shrink-0 cursor-pointer ${
                selectedSuit === s.id
                  ? 'bg-emerald-500 text-zinc-950 shadow-lg'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              <span>{s.symbol}</span>
              <span>{s.name} (10)</span>
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          {suitsToDisplay.map((suitObj) => (
            <div key={suitObj.id} className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-black text-white uppercase tracking-wider bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                <span className="text-lg">{suitObj.symbol}</span>
                <span>{suitObj.name}</span>
                <span className="text-[10px] text-zinc-400 font-normal ml-auto font-mono">
                  10 carte • {suitObj.desc}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2.5">
                {ALL_RANKS.slice().sort((a, b) => a - b).map((rank) => {
                  const info = RANK_INFO[rank];
                  const imgUrl = `/cards/piacentine/${suitObj.id}_${rank}.jpg`;

                  return (
                    <motion.div
                      key={rank}
                      whileHover={{ scale: 1.05, y: -4 }}
                      onClick={() => setPreviewCard({ suit: suitObj.id, rank })}
                      className="bg-zinc-950 border border-zinc-800 hover:border-emerald-500 rounded-xl p-1.5 flex flex-col items-center gap-1 cursor-pointer transition shadow-md group relative"
                    >
                      <div className="w-full aspect-[7/12] overflow-hidden rounded-lg bg-zinc-900 relative">
                        <img
                          src={imgUrl}
                          alt={`${info.name} di ${suitObj.name}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {info.points > 0 && (
                          <span className="absolute top-1 right-1 bg-emerald-500 text-zinc-950 text-[9px] font-mono font-black px-1 rounded shadow">
                            +{info.points}
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="text-center w-full">
                        <span className="text-[11px] font-bold text-zinc-200 block truncate">
                          {info.name}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500">
                          {info.points > 0 ? `${info.points} pt` : '0 pt'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Large Card Preview Modal */}
        <AnimatePresence>
          {previewCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewCard(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-60 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-6 max-w-sm w-full text-center relative shadow-2xl"
              >
                <button
                  onClick={() => setPreviewCard(null)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="max-w-[220px] mx-auto rounded-2xl overflow-hidden shadow-2xl border-2 border-zinc-600 mb-4 bg-zinc-950">
                  <img
                    src={`/cards/piacentine/${previewCard.suit}_${previewCard.rank}.jpg`}
                    alt="Carta"
                    className="w-full h-auto object-cover"
                  />
                </div>

                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  {RANK_INFO[previewCard.rank]?.name} di {SUITS.find((s) => s.id === previewCard.suit)?.name}
                </h3>
                <p className="text-xs text-emerald-400 font-mono mt-1 font-bold">
                  Punti: {RANK_INFO[previewCard.rank]?.points} pt • Gerarchia: {RANK_INFO[previewCard.rank]?.hierarchy} / 10
                </p>

                <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-center">
                  <a
                    href={`/cards/piacentine/${previewCard.suit}_${previewCard.rank}.jpg`}
                    download={`piacentine_${previewCard.suit}_${previewCard.rank}.jpg`}
                    className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase px-4 py-2.5 rounded-xl transition font-mono tracking-wider"
                  >
                    Scarica File JPG
                  </a>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
