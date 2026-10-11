import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, QrCode, Sparkles, LogOut } from 'lucide-react';
import { Card, GameState, Player } from '../types';
import { CardView } from './CardView';
import { sounds, SUITS } from '../utils/briscola';

interface GameBoardProps {
  state: GameState;
  myHand: Card[];
  myPlayerId: string;
  onPlayCard: (cardId: string) => void;
  onLeaveGame: () => void;
  onOpenQR: () => void;
  onOpenDeckGallery: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  state,
  myHand,
  myPlayerId,
  onPlayCard,
  onLeaveGame,
  onOpenQR,
  onOpenDeckGallery,
}) => {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const myPlayer = state.players.find((p) => p.id === myPlayerId);
  const mySeat = myPlayer?.seatIndex ?? 0;
  const isMyTurn =
    state.currentTurnPlayerId === myPlayerId &&
    state.tableCards.length < state.players.length;

  // Sound effects trigger on state updates
  useEffect(() => {
    if (state.lastTrick) {
      sounds.playTrickWin();
    }
  }, [state.lastTrick]);

  useEffect(() => {
    if (state.status === 'match_ended') {
      sounds.playGameWin();
    }
  }, [state.status]);

  // Order opponents relative to my seat so I am always at the bottom
  const totalSeats = state.players.length;
  const orderedPlayers: { player: Player; position: 'top' | 'left' | 'right' | 'bottom' }[] = [];

  state.players.forEach((p) => {
    const relSeat = (p.seatIndex - mySeat + totalSeats) % totalSeats;
    let position: 'top' | 'left' | 'right' | 'bottom' = 'bottom';

    if (totalSeats === 2) {
      position = relSeat === 0 ? 'bottom' : 'top';
    } else {
      // 4 players
      if (relSeat === 0) position = 'bottom';
      else if (relSeat === 1) position = 'left';
      else if (relSeat === 2) position = 'top';
      else position = 'right';
    }

    orderedPlayers.push({ player: p, position });
  });

  const briscolaSuitObj = SUITS.find((s) => s.id === state.briscolaCard?.suit);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-2 sm:p-4 select-none overflow-hidden relative font-sans">
      {/* Top Header Bar */}
      <header className="bg-zinc-900/95 border-2 border-zinc-800 backdrop-blur-md rounded-2xl p-3 sm:p-4 flex items-center justify-between z-30 shadow-2xl">
        {/* Left: Room & Round Info */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/30 hidden sm:block">
            <span className="text-2xl font-black">🎴</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-white text-base tracking-tight uppercase">
                Stanza: <span className="text-emerald-400">{state.roomId}</span>
              </span>
              <button
                id="header-qr-btn"
                onClick={onOpenQR}
                className="text-zinc-400 hover:text-emerald-400 p-1 transition"
                title="QR Code Stanza"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-zinc-500 font-mono font-bold uppercase tracking-widest block">
              Mano {state.currentRound} • {state.mode === '1v1' ? '1 vs 1' : '2 vs 2'}
            </span>
          </div>
        </div>

        {/* Center: Team Scores */}
        <div className="flex items-center gap-4 sm:gap-8 bg-zinc-950 px-4 sm:px-6 py-2 rounded-2xl border-2 border-zinc-800">
          <div className="text-center">
            <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-widest block">Squadra 1</span>
            <span className="text-xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tighter">
              {state.team1Score} <span className="text-xs text-zinc-600 font-normal">PT</span>
            </span>
          </div>

          <span className="text-zinc-700 font-black text-xs uppercase tracking-widest">VS</span>

          <div className="text-center">
            <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-widest block">Squadra 2</span>
            <span className="text-xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tighter">
              {state.team2Score} <span className="text-xs text-zinc-600 font-normal">PT</span>
            </span>
          </div>
        </div>

        {/* Right: Briscola Trump Badge & Leave Button */}
        <div className="flex items-center gap-2">
          {state.briscolaCard && (
            <div className="bg-zinc-950 border-2 border-emerald-500/40 px-3 py-1.5 rounded-2xl flex items-center gap-2 shadow-inner">
              <span className="text-3xl">{briscolaSuitObj?.symbol}</span>
              <div className="hidden sm:block text-left leading-tight">
                <span className="text-[9px] uppercase font-mono text-emerald-400 font-black tracking-widest block">
                  Briscola
                </span>
                <span className="text-xs font-black uppercase text-white tracking-wider">
                  {briscolaSuitObj?.name}
                </span>
              </div>
            </div>
          )}

          <button
            id="gameboard-deck-gallery-btn"
            onClick={onOpenDeckGallery}
            className="bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 p-2.5 sm:px-3 sm:py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
            title="Visualizza Mazzo (40 Carte)"
          >
            <span className="text-sm">🎴</span>
            <span className="hidden lg:inline">Mazzo</span>
          </button>

          <button
            id="leave-game-btn"
            onClick={() => setShowLeaveConfirm(true)}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
            title="Abbandona la partita"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Esci</span>
          </button>
        </div>
      </header>

      {/* Confirmation Exit Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl relative"
          >
            <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <LogOut className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
              Abbandona Partita
            </h3>

            <p className="text-xs text-zinc-400 mb-6 leading-relaxed font-medium">
              Sei sicuro di voler abbandonare la partita in corso e tornare al menu principale?
            </p>

            <div className="flex gap-3">
              <button
                id="cancel-leave-btn"
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black py-3.5 px-4 rounded-2xl text-xs uppercase tracking-wider transition border border-zinc-700 cursor-pointer"
              >
                Annulla
              </button>
              <button
                id="confirm-leave-btn"
                onClick={() => {
                  setShowLeaveConfirm(false);
                  onLeaveGame();
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black py-3.5 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-red-500/20 transition cursor-pointer"
              >
                Sì, Abbandona
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Card Table Felt Canvas */}
      <main className="flex-1 my-3 bg-zinc-900 border-4 sm:border-8 border-zinc-800 rounded-3xl p-3 sm:p-6 shadow-[0_0_60px_rgba(0,0,0,0.8)] relative flex flex-col justify-between overflow-hidden">
        {/* Dark subtle grid texture overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        {/* Opponents Layout (Top, Left, Right) */}
        <div className="relative z-20 flex justify-between items-start">
          {/* Left Player (4p mode) */}
          {orderedPlayers.find((p) => p.position === 'left') && (
            <div className="flex flex-col items-center">
              <PlayerAvatar
                player={orderedPlayers.find((p) => p.position === 'left')!.player}
                isTurn={
                  state.currentTurnPlayerId ===
                  orderedPlayers.find((p) => p.position === 'left')!.player.id
                }
              />
            </div>
          )}

          {/* Top Player (2p or 4p mode) */}
          {orderedPlayers.find((p) => p.position === 'top') && (
            <div className="mx-auto flex flex-col items-center">
              <PlayerAvatar
                player={orderedPlayers.find((p) => p.position === 'top')!.player}
                isTurn={
                  state.currentTurnPlayerId ===
                  orderedPlayers.find((p) => p.position === 'top')!.player.id
                }
              />
              <div className="flex gap-1.5 mt-2">
                {Array.from({
                  length: orderedPlayers.find((p) => p.position === 'top')!.player.cardsCount,
                }).map((_, i) => (
                  <CardView key={i} faceDown size="sm" />
                ))}
              </div>
            </div>
          )}

          {/* Right Player (4p mode) */}
          {orderedPlayers.find((p) => p.position === 'right') && (
            <div className="flex flex-col items-center">
              <PlayerAvatar
                player={orderedPlayers.find((p) => p.position === 'right')!.player}
                isTurn={
                  state.currentTurnPlayerId ===
                  orderedPlayers.find((p) => p.position === 'right')!.player.id
                }
              />
            </div>
          )}
        </div>

        {/* Center Table: Deck & Played Cards */}
        <div className="my-auto relative z-20 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 min-h-[180px]">
          {/* Deck & Briscola Stack */}
          <div className="relative flex items-center justify-center">
            {state.deckCount > 0 ? (
              <div className="relative">
                {/* Horizontal Face-Up Briscola Card under deck */}
                {state.briscolaCard && (
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 rotate-90 z-0">
                    <CardView card={state.briscolaCard} isBriscola size="md" />
                  </div>
                )}

                {/* Face-Down Deck Stack */}
                <div className="relative z-10">
                  <CardView faceDown size="md" />
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-mono font-black uppercase text-emerald-400 bg-zinc-950 px-2.5 py-1 rounded-full border-2 border-zinc-800 whitespace-nowrap tracking-wider">
                    {state.deckCount} carte
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center p-3 border-2 border-dashed border-zinc-700 rounded-2xl bg-zinc-950/60 text-xs text-zinc-500 font-mono font-bold uppercase tracking-wider">
                Mazzo esaurito
              </div>
            )}
          </div>

          {/* Played Cards Area on Table */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 min-h-[130px] bg-zinc-950/80 p-5 rounded-3xl border-2 border-zinc-800 shadow-inner">
            <AnimatePresence>
              {state.tableCards.length === 0 ? (
                <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest font-bold text-center px-4">
                  In attesa che un giocatore giochi una carta...
                </span>
              ) : (
                state.tableCards.map((played) => {
                  const player = state.players.find((p) => p.id === played.playerId);
                  return (
                    <motion.div
                      key={played.card.id}
                      initial={{ scale: 0.5, opacity: 0, y: -20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <CardView card={played.card} size="md" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-zinc-900 px-2.5 py-0.5 rounded-full border border-zinc-700 font-mono">
                        {player?.name}
                      </span>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Last Trick Winner Toast Indicator */}
        {state.lastTrick && state.tableCards.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-emerald-500 text-zinc-950 font-black px-5 py-2 rounded-full shadow-2xl text-xs flex items-center gap-2 border-2 border-emerald-400 uppercase tracking-wider animate-in fade-in duration-300">
            <Trophy className="w-4 h-4 fill-current" />
            <span>
              Prese vinta da{' '}
              <strong className="underline">
                {state.players.find((p) => p.id === state.lastTrick?.winnerId)?.name}
              </strong>{' '}
              (+{state.lastTrick.points} pt)
            </span>
          </div>
        )}

        {/* Bottom Area: Your Hand */}
        <div className="relative z-30 flex flex-col items-center">
          {/* Turn Indicator Banner */}
          {isMyTurn ? (
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="bg-emerald-500 text-zinc-950 font-black px-6 py-2 rounded-full shadow-2xl text-xs sm:text-sm flex items-center gap-2 mb-3 border-2 border-emerald-400 uppercase tracking-[0.2em]"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>È IL TUO TURNO! Scegli una carta</span>
            </motion.div>
          ) : (
            <div className="text-xs text-zinc-400 font-mono font-bold uppercase tracking-wider mb-3 bg-zinc-950 px-4 py-1.5 rounded-full border border-zinc-800">
              Turno di:{' '}
              <strong className="text-emerald-400">
                {state.players.find((p) => p.id === state.currentTurnPlayerId)?.name}
              </strong>
            </div>
          )}

          {/* Cards in Your Hand */}
          <div className="flex justify-center items-center gap-3 sm:gap-5 max-w-full overflow-x-auto p-2">
            {myHand.map((card) => (
              <CardView
                key={card.id}
                card={card}
                isPlayable={isMyTurn}
                onClick={() => {
                  if (isMyTurn) {
                    sounds.playCardPlay();
                    onPlayCard(card.id);
                  }
                }}
                size="lg"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

function PlayerAvatar({ player, isTurn }: { player: Player; isTurn: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition ${
        isTurn
          ? 'bg-zinc-900 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
          : 'bg-zinc-950 border-zinc-800'
      }`}
    >
      <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center font-black text-emerald-400 text-sm font-mono shadow">
        {player.name[0].toUpperCase()}
      </div>
      <div className="text-left leading-tight">
        <span className="font-black text-sm text-white uppercase tracking-wider block">{player.name}</span>
        <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
          {player.pointsWon} PT ({player.tricksWonCount} prese)
        </span>
      </div>
    </div>
  );
}
