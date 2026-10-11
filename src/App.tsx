import React, { useState, useEffect, useRef } from 'react';
import { Card, GameMode, GameState, WSMessage } from './types';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { ChatAndReactions } from './components/ChatAndReactions';
import { EndGameModal } from './components/EndGameModal';
import { QRCodeModal } from './components/QRCodeModal';
import { DeckGalleryModal } from './components/DeckGalleryModal';

export default function App() {
  const [playerId] = useState(() => {
    const saved = localStorage.getItem('briscola_player_id');
    if (saved) return saved;
    const newId = `p_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('briscola_player_id', newId);
    return newId;
  });

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myHand, setMyHand] = useState<Card[]>([]);
  const [mode, setMode] = useState<GameMode>('1v1');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDeckGallery, setShowDeckGallery] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { id: string; senderName: string; text: string; time: string }[]
  >([]);
  const [activeReactions, setActiveReactions] = useState<
    { id: string; playerId: string; reaction: string }[]
  >([]);

  const wsRef = useRef<WebSocket | null>(null);

  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // If we were in a room, rejoin automatically
      if (gameState?.roomId) {
        ws.send(
          JSON.stringify({
            type: 'join_room',
            roomId: gameState.roomId,
            playerId,
            playerName:
              gameState.players.find((p) => p.id === playerId)?.name || 'Giocatore',
            mode,
          })
        );
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);

        if (msg.type === 'room_state' && msg.state) {
          setGameState(msg.state);
        } else if (msg.type === 'your_hand' && msg.hand) {
          setMyHand(msg.hand);
        } else if (msg.type === 'reaction_broadcast' && msg.reaction && msg.playerId) {
          const reactionObj = {
            id: `r_${Date.now()}_${Math.random()}`,
            playerId: msg.playerId,
            reaction: msg.reaction,
          };
          setActiveReactions((prev) => [...prev, reactionObj]);
          setTimeout(() => {
            setActiveReactions((prev) => prev.filter((r) => r.id !== reactionObj.id));
          }, 2500);
        } else if (msg.type === 'chat_broadcast' && msg.chatText) {
          const chatObj = {
            id: `c_${Date.now()}_${Math.random()}`,
            senderName: msg.playerName || 'Giocatore',
            text: msg.chatText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setChatMessages((prev) => [...prev, chatObj]);
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    ws.onclose = () => {
      setTimeout(() => {
        connectWebSocket();
      }, 2000);
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const handleJoinRoom = (playerName: string, roomId: string, selectedMode: GameMode) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWebSocket();
    }

    wsRef.current?.send(
      JSON.stringify({
        type: 'join_room',
        roomId,
        playerId,
        playerName,
        mode: selectedMode,
      })
    );
  };

  const handleAddBot = (difficulty: 'easy' | 'medium' | 'hard') => {
    wsRef.current?.send(
      JSON.stringify({
        type: 'add_bot',
        botDifficulty: difficulty,
      })
    );
  };

  const handleRemoveBot = () => {
    wsRef.current?.send(
      JSON.stringify({
        type: 'remove_bot',
      })
    );
  };

  const handleStartGame = () => {
    wsRef.current?.send(
      JSON.stringify({
        type: 'start_game',
      })
    );
  };

  const handlePlayCard = (cardId: string) => {
    wsRef.current?.send(
      JSON.stringify({
        type: 'play_card',
        cardId,
      })
    );
  };

  const handleSendReaction = (reaction: string) => {
    wsRef.current?.send(
      JSON.stringify({
        type: 'send_reaction',
        reaction,
      })
    );
  };

  const handleSendMessage = (chatText: string) => {
    wsRef.current?.send(
      JSON.stringify({
        type: 'chat_message',
        chatText,
      })
    );
  };

  const handleRematch = () => {
    wsRef.current?.send(
      JSON.stringify({
        type: 'rematch',
      })
    );
  };

  const handleLeaveGame = () => {
    wsRef.current?.send(
      JSON.stringify({
        type: 'leave_room',
      })
    );
    setGameState(null);
    setMyHand([]);
    setChatMessages([]);
    setActiveReactions([]);
  };

  const isHost = gameState?.players.find((p) => p.id === playerId)?.isHost || false;
  const isInRoom = !!gameState;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {!gameState || gameState.status === 'waiting' ? (
        <Lobby
          onJoinRoom={handleJoinRoom}
          onAddBot={handleAddBot}
          onRemoveBot={handleRemoveBot}
          onStartGame={handleStartGame}
          onLeaveGame={handleLeaveGame}
          onOpenQR={() => setShowQRModal(true)}
          onOpenDeckGallery={() => setShowDeckGallery(true)}
          players={gameState?.players || []}
          roomId={gameState?.roomId || ''}
          isHost={isHost}
          isInRoom={isInRoom}
          mode={mode}
          setMode={setMode}
        />
      ) : (
        <>
          <GameBoard
            state={gameState}
            myHand={myHand}
            myPlayerId={playerId}
            onPlayCard={handlePlayCard}
            onLeaveGame={handleLeaveGame}
            onOpenQR={() => setShowQRModal(true)}
            onOpenDeckGallery={() => setShowDeckGallery(true)}
          />

          <ChatAndReactions
            onSendReaction={handleSendReaction}
            onSendMessage={handleSendMessage}
            messages={chatMessages}
            activeReactions={activeReactions}
          />

          {(gameState.status === 'round_ended' || gameState.status === 'match_ended') && (
            <EndGameModal
              state={gameState}
              myPlayerId={playerId}
              onRematch={handleRematch}
            />
          )}
        </>
      )}

      {showQRModal && gameState && (
        <QRCodeModal roomId={gameState.roomId} onClose={() => setShowQRModal(false)} />
      )}

      <DeckGalleryModal
        isOpen={showDeckGallery}
        onClose={() => setShowDeckGallery(false)}
      />
    </div>
  );
}
