import React from 'react';
import { Trophy, RotateCcw, Award, CheckCircle, Users } from 'lucide-react';
import { GameState } from '../types';

interface EndGameModalProps {
  state: GameState;
  myPlayerId: string;
  onRematch: () => void;
}

export const EndGameModal: React.FC<EndGameModalProps> = ({ state, myPlayerId, onRematch }) => {
  const myPlayer = state.players.find((p) => p.id === myPlayerId);
  const myTeam = myPlayer?.team || 1;

  const isMatchEnd = state.status === 'match_ended';
  const winningTeam = isMatchEnd ? state.matchWinnerTeam : state.roundWinnerTeam;

  const didMyTeamWin = winningTeam === myTeam;
  const isDraw = winningTeam === 0;

  return (
    <div
      id="end-game-modal-backdrop"
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300 font-sans"
    >
      <div
        id="end-game-modal-card"
        className="bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(16,185,129,0.15)] relative overflow-hidden"
      >
        {/* Background Glow */}
        <div
          className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-30 ${
            didMyTeamWin ? 'bg-emerald-500' : isDraw ? 'bg-blue-500' : 'bg-rose-500'
          }`}
        />

        <div className="relative z-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-950 text-emerald-400 flex items-center justify-center border-2 border-emerald-500/40 shadow-xl">
            {didMyTeamWin ? (
              <Trophy className="w-9 h-9 text-emerald-400 animate-bounce" />
            ) : isDraw ? (
              <Award className="w-9 h-9 text-blue-400" />
            ) : (
              <Users className="w-9 h-9 text-rose-400" />
            )}
          </div>

          <span className="text-xs font-mono font-bold tracking-[0.3em] text-emerald-500 uppercase block mb-1">
            {isMatchEnd ? 'Partita Conclusa' : `Mano ${state.currentRound} Completata`}
          </span>

          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mt-1 mb-2">
            {isDraw ? 'Pareggio!' : didMyTeamWin ? 'VITTORIA!' : 'Sconfitta'}
          </h2>

          <p className="text-xs text-zinc-400 mb-6 font-medium">
            {isDraw
              ? 'Entrambe le squadre hanno totalizzato 60 punti!'
              : didMyTeamWin
              ? 'La tua squadra ha dominato il tavolo di gioco!'
              : 'La squadra avversaria ha raggiunto la quota punti!'}
          </p>

          {/* Scores Breakdown Box */}
          <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-4 rounded-2xl border-2 border-zinc-800 mb-6">
            <div
              className={`p-3 rounded-xl border-2 ${
                myTeam === 1
                  ? 'bg-zinc-900 border-emerald-500/50'
                  : 'bg-zinc-950 border-zinc-800'
              }`}
            >
              <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-widest block">Squadra 1</span>
              <span className="text-3xl font-black font-mono text-emerald-400 tracking-tighter">{state.team1Score}</span>
              <span className="text-[10px] text-zinc-500 font-mono block mt-0.5 uppercase tracking-wider">punti</span>
            </div>

            <div
              className={`p-3 rounded-xl border-2 ${
                myTeam === 2
                  ? 'bg-zinc-900 border-emerald-500/50'
                  : 'bg-zinc-950 border-zinc-800'
              }`}
            >
              <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-widest block">Squadra 2</span>
              <span className="text-3xl font-black font-mono text-emerald-400 tracking-tighter">{state.team2Score}</span>
              <span className="text-[10px] text-zinc-500 font-mono block mt-0.5 uppercase tracking-wider">punti</span>
            </div>
          </div>

          {/* Player stats */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 mb-6 text-left space-y-2 text-xs">
            <span className="text-[10px] font-black text-zinc-500 uppercase font-mono tracking-widest block mb-2">
              Dettaglio Prese Giocatori
            </span>
            {state.players.map((p) => (
              <div key={p.id} className="flex justify-between items-center text-zinc-300">
                <span className="flex items-center gap-2 font-bold">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: p.avatar }}
                  />
                  {p.name} {p.id === myPlayerId ? '(Tu)' : ''}
                </span>
                <span className="font-mono font-black text-emerald-400">
                  {p.pointsWon} PT ({p.tricksWonCount} prese)
                </span>
              </div>
            ))}
          </div>

          <button
            id="rematch-btn"
            onClick={onRematch}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm uppercase tracking-[0.2em] shadow-xl transition transform active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Gioca Un&apos;Altra Mano</span>
          </button>
        </div>
      </div>
    </div>
  );
};
