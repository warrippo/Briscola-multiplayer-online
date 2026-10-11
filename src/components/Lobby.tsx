import React, { useState, useEffect } from 'react';
import { Users, Play, Copy, Check, QrCode, Trash2, Crown, Smartphone, Sparkles, LogOut, Plus } from 'lucide-react';
import { GameMode, Player } from '../types';

interface LobbyProps {
  onJoinRoom: (playerName: string, roomId: string, mode: GameMode) => void;
  onAddBot: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onRemoveBot: () => void;
  onStartGame: () => void;
  onLeaveGame: () => void;
  onOpenQR: () => void;
  onOpenDeckGallery: () => void;
  players: Player[];
  roomId: string;
  isHost: boolean;
  isInRoom: boolean;
  mode: GameMode;
  setMode: (mode: GameMode) => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  onJoinRoom,
  onAddBot,
  onRemoveBot,
  onStartGame,
  onLeaveGame,
  onOpenQR,
  onOpenDeckGallery,
  players,
  roomId,
  isHost,
  isInRoom,
  mode,
  setMode,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedBotDiff, setSelectedBotDiff] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Auto detect room from URL params ?room=XXXX
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setInputRoomId(roomParam.toUpperCase());
      }
    }
  }, []);

  const handleCreateNewRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    onJoinRoom(playerName.trim(), randomCode, mode);
  };

  const handleJoinExistingRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !inputRoomId.trim()) return;
    onJoinRoom(playerName.trim(), inputRoomId.trim().toUpperCase(), mode);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maxPlayers = mode === '1v1' ? 2 : 4;

  if (!isInRoom) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Ambient table glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-lg w-full bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative z-10">
          <div className="text-left mb-8">
            <span className="text-emerald-500 font-mono text-xs uppercase tracking-[0.3em] font-bold block mb-2">
              Multiplayer Card Game
            </span>
            <h1 className="text-5xl sm:text-6xl font-black leading-none tracking-tighter uppercase text-white">
              Briscola <br />
              <span className="text-emerald-500">Online</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-3 font-medium">
              Sfida i tuoi amici in tempo reale da qualsiasi dispositivo. Seleziona la modalità e scendi in campo!
            </p>
          </div>

          <div className="space-y-6">
            {/* Player Name Input */}
            <div>
              <label htmlFor="player-name-input" className="block text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 font-mono">
                Il Tuo Nome / Nickname
              </label>
              <input
                id="player-name-input"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="ES. MARCO, SOFIA..."
                maxLength={18}
                className="w-full bg-zinc-950 border-2 border-zinc-800 text-white rounded-2xl px-5 py-3.5 text-base focus:outline-none focus:border-emerald-500 font-bold uppercase tracking-wider transition"
              />
            </div>

            {/* Game Mode Switcher */}
            <div>
              <label className="block text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 font-mono">
                Modalità di Gioco
              </label>
              <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-2 rounded-2xl border-2 border-zinc-800">
                <button
                  type="button"
                  id="mode-1v1-btn"
                  onClick={() => setMode('1v1')}
                  className={`py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 ${
                    mode === '1v1'
                      ? 'bg-emerald-500 text-zinc-950 shadow-lg'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>1 vs 1</span>
                </button>
                <button
                  type="button"
                  id="mode-2v2-btn"
                  onClick={() => setMode('2v2')}
                  className={`py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 ${
                    mode === '2v2'
                      ? 'bg-emerald-500 text-zinc-950 shadow-lg'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>2 vs 2</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 space-y-4">
              {/* Create Room Button */}
              <button
                id="create-room-btn"
                onClick={handleCreateNewRoom}
                disabled={!playerName.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 disabled:opacity-40 font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/10 transition transform active:scale-98 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 fill-current" />
                <span>Crea Nuova Stanza</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-zinc-800"></div>
                <span className="flex-shrink mx-3 text-[10px] text-zinc-500 uppercase font-mono tracking-widest font-bold">
                  oppure inserisci un codice
                </span>
                <div className="flex-grow border-t border-zinc-800"></div>
              </div>

              {/* Join Existing Room Input & Button */}
              <form onSubmit={handleJoinExistingRoom} className="flex gap-2">
                <input
                  id="room-code-input"
                  type="text"
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                  placeholder="CODICE"
                  maxLength={8}
                  className="w-full bg-zinc-950 border-2 border-zinc-800 text-emerald-400 font-mono font-black uppercase tracking-widest rounded-2xl px-4 py-3.5 text-base focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  id="join-room-btn"
                  disabled={!playerName.trim() || !inputRoomId.trim()}
                  className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-emerald-400 font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-widest transition border-2 border-zinc-700 cursor-pointer"
                >
                  Entra
                </button>
              </form>

              {/* View Deck Button */}
              <button
                type="button"
                id="open-deck-gallery-lobby"
                onClick={onOpenDeckGallery}
                className="w-full mt-3 bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80 hover:border-emerald-500/50 py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase font-mono tracking-wider transition cursor-pointer"
              >
                <span className="text-sm">🎴</span>
                <span>Visualizza Mazzo (40 Carte Piacentine)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Inside Room Waiting Lobby
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="max-w-xl w-full bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Lobby Header */}
        <div className="flex justify-between items-start pb-6 mb-6 border-b border-zinc-800">
          <div>
            <span className="text-xs font-mono text-emerald-500 uppercase tracking-[0.3em] font-bold block mb-1">
              Stanza di Gioco • {mode}
            </span>
            <h2 className="text-4xl font-black font-mono text-white tracking-tighter uppercase">
              {roomId}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="deck-gallery-btn"
              onClick={onOpenDeckGallery}
              className="bg-zinc-800 hover:bg-zinc-700 text-emerald-400 p-3 rounded-2xl border border-zinc-700 transition cursor-pointer"
              title="Visualizza le 40 Carte del Mazzo"
            >
              <span className="text-base leading-none">🎴</span>
            </button>
            <button
              id="qr-button"
              onClick={onOpenQR}
              className="bg-zinc-800 hover:bg-zinc-700 text-emerald-400 p-3 rounded-2xl border border-zinc-700 transition"
              title="Mostra QR Code da inquadrare"
            >
              <QrCode className="w-5 h-5" />
            </button>
            <button
              id="copy-link-btn"
              onClick={handleCopyLink}
              className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition shadow"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiato!' : 'Invita'}</span>
            </button>
            <button
              id="lobby-leave-room-btn"
              onClick={() => setShowLeaveConfirm(true)}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 p-3 rounded-2xl transition"
              title="Esci dalla stanza"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Conferma Uscita Stanza */}
        {showLeaveConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl relative">
              <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <LogOut className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                Esci dalla Stanza
              </h3>

              <p className="text-xs text-zinc-400 mb-6 leading-relaxed font-medium">
                Sei sicuro di voler uscire da questa stanza e tornare al menu principale?
              </p>

              <div className="flex gap-3">
                <button
                  id="cancel-leave-lobby-btn"
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black py-3.5 px-4 rounded-2xl text-xs uppercase tracking-wider transition border border-zinc-700 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  id="confirm-leave-lobby-btn"
                  onClick={() => {
                    setShowLeaveConfirm(false);
                    onLeaveGame();
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black py-3.5 px-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-red-500/20 transition cursor-pointer"
                >
                  Sì, Esci
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-zinc-950 border-2 border-zinc-800 rounded-2xl p-4 mb-6 flex items-center gap-3 text-xs text-zinc-300">
          <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            Condividi il codice <strong className="text-emerald-400 font-mono text-sm">{roomId}</strong> o il QR Code con i tuoi compagni di gioco.
          </span>
        </div>

        {/* Players Seats List */}
        <div className="space-y-3 mb-8">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">
            <span>Giocatori ({players.length}/{maxPlayers})</span>
            {mode === '2v2' && <span>Squadra 1 vs Squadra 2</span>}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: maxPlayers }).map((_, idx) => {
              const player = players.find((p) => p.seatIndex === idx);
              const isTeam1 = idx % 2 === 0;

              if (player) {
                return (
                  <div
                    key={player.id}
                    className="bg-zinc-950 border-2 border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-black text-emerald-500 font-mono">
                        0{idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-white">{player.name}</span>
                          {player.isHost && (
                            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-black uppercase font-mono tracking-wider flex items-center gap-1 border border-emerald-500/30">
                              <Crown className="w-3 h-3" /> Host
                            </span>
                          )}
                          {player.isBot && (
                            <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-black uppercase font-mono tracking-wider border border-purple-500/30">
                              AI Bot ({player.botDifficulty})
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                          {mode === '2v2' ? (isTeam1 ? 'Squadra 1' : 'Squadra 2') : `Giocatore ${idx + 1}`}
                        </span>
                      </div>
                    </div>

                    {player.isBot && isHost && (
                      <button
                        id={`remove-bot-btn-${player.id}`}
                        onClick={onRemoveBot}
                        className="text-red-400 hover:text-red-300 p-2.5 hover:bg-zinc-900 rounded-xl transition"
                        title="Rimuovi Bot"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={`empty-${idx}`}
                  className="bg-zinc-950/50 border-2 border-dashed border-zinc-800 rounded-2xl p-4 flex items-center justify-between text-zinc-500 text-xs"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-black text-zinc-800 font-mono">
                      0{idx + 1}
                    </span>
                    <span className="font-bold uppercase tracking-wider text-zinc-600">
                      In attesa...
                    </span>
                  </div>

                  {isHost && (
                    <div className="flex items-center gap-2">
                      <select
                        id={`bot-diff-select-${idx}`}
                        value={selectedBotDiff}
                        onChange={(e) => setSelectedBotDiff(e.target.value as 'easy' | 'medium' | 'hard')}
                        className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-xl px-2.5 py-1.5 font-mono font-bold"
                      >
                        <option value="easy">Facile</option>
                        <option value="medium">Medio</option>
                        <option value="hard">Esperto</option>
                      </select>
                      <button
                        type="button"
                        id={`add-bot-btn-${idx}`}
                        onClick={() => onAddBot(selectedBotDiff)}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-black px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Bot
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Start Game Action */}
        {isHost ? (
          <button
            id="start-game-btn"
            onClick={onStartGame}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 text-base uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/10 transition active:scale-98 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Avvia la Partita</span>
          </button>
        ) : (
          <div className="text-center bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-xs text-emerald-400 font-black uppercase tracking-wider">
            In attesa che l&apos;Host avvii la partita...
          </div>
        )}
      </div>
    </div>
  );
};
