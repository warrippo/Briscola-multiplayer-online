import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { WebSocket, WebSocketServer } from 'ws';
import { Card, GameMode, GameState, PlayedCard, Player, WSMessage } from './src/types';
import { calculateTrickPoints, createDeck, evaluateTrick, selectBotCard, shuffleDeck } from './src/utils/briscola';

interface ExtendedWebSocket extends WebSocket {
  roomId?: string;
  playerId?: string;
  isAlive?: boolean;
}

interface RoomInternal {
  state: GameState;
  deck: Card[];
  playerHands: Map<string, Card[]>; // playerId -> Card[]
  sockets: Map<string, ExtendedWebSocket>; // playerId -> WebSocket
  botTimers: Map<string, NodeJS.Timeout>;
  lastTrickResolvedAt?: number;
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));
app.use('/cards', express.static(path.join(process.cwd(), 'public/cards')));

const rooms = new Map<string, RoomInternal>();

// API endpoints
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size });
});

app.get('/api/room/:id', (req, res) => {
  const roomId = req.params.id.toUpperCase();
  const room = rooms.get(roomId);
  if (!room) {
    res.json({ exists: false });
  } else {
    res.json({
      exists: true,
      mode: room.state.mode,
      status: room.state.status,
      playersCount: room.state.players.length,
      maxPlayers: room.state.mode === '1v1' ? 2 : 4,
    });
  }
});

// Helper: Broadcast state and individual hands
function broadcastRoomState(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const publicPlayers: Player[] = room.state.players.map((p) => {
    const hand = room.playerHands.get(p.id) || [];
    return {
      ...p,
      cardsCount: hand.length,
    };
  });

  const publicState: GameState = {
    ...room.state,
    players: publicPlayers,
  };

  room.sockets.forEach((ws, playerId) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        // Send public game state
        ws.send(JSON.stringify({ type: 'room_state', state: publicState }));

        // Send private hand
        const hand = room.playerHands.get(playerId) || [];
        ws.send(JSON.stringify({ type: 'your_hand', hand }));
      } catch (err) {
        console.error(`Error sending room state to ${playerId}:`, err);
      }
    }
  });
}

function broadcastToRoom(roomId: string, message: WSMessage, excludePlayerId?: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.sockets.forEach((ws, pid) => {
    if (pid !== excludePlayerId && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (err) {
        console.error(`Error broadcasting message to ${pid}:`, err);
      }
    }
  });
}

// Watchdog timer to automatically recover stuck bot turns or full-trick evaluation delays
setInterval(() => {
  rooms.forEach((room, roomId) => {
    if (room.state.status !== 'playing') return;

    // Case 1: Full table trick resolution stalled for > 2.2s
    if (room.state.tableCards.length >= room.state.players.length) {
      if (!room.lastTrickResolvedAt || Date.now() - room.lastTrickResolvedAt > 2200) {
        room.lastTrickResolvedAt = Date.now();
        resolveTrick(roomId);
      }
      return;
    }

    // Case 2: It is a Bot's turn and no timer is pending or turn is stuck
    const currentTurnPlayer = room.state.players.find((p) => p.id === room.state.currentTurnPlayerId);
    if (currentTurnPlayer && currentTurnPlayer.isBot) {
      if (!room.botTimers.has(currentTurnPlayer.id)) {
        scheduleBotTurn(roomId);
      }
    }
  });
}, 1000);

// Bot turn handler
function scheduleBotTurn(roomId: string) {
  const room = rooms.get(roomId);
  if (!room || room.state.status !== 'playing') return;

  // Do not schedule bot turns if table is full and trick resolution is pending
  if (room.state.tableCards.length >= room.state.players.length) return;

  const currentTurnPlayer = room.state.players.find((p) => p.id === room.state.currentTurnPlayerId);
  if (!currentTurnPlayer || !currentTurnPlayer.isBot) return;

  const botId = currentTurnPlayer.id;
  // Clear any existing timer for this bot
  if (room.botTimers.has(botId)) {
    clearTimeout(room.botTimers.get(botId));
    room.botTimers.delete(botId);
  }

  const timer = setTimeout(() => {
    if (room.botTimers.get(botId) === timer) {
      room.botTimers.delete(botId);
    }
    executeBotTurn(roomId, botId);
  }, 1000);

  room.botTimers.set(botId, timer);
}

function executeBotTurn(roomId: string, botId: string) {
  const room = rooms.get(roomId);
  if (!room || room.state.status !== 'playing') return;

  // Double check turn and table capacity
  if (room.state.currentTurnPlayerId !== botId) return;
  if (room.state.tableCards.length >= room.state.players.length) return;

  const currentTurnPlayer = room.state.players.find((p) => p.id === botId);
  if (!currentTurnPlayer) return;

  const botHand = room.playerHands.get(botId) || [];
  if (botHand.length === 0) {
    console.warn(`Bot ${botId} hand is empty during execution. Hand size 0.`);
    return;
  }

  const playerTeams: Record<string, 1 | 2> = {};
  room.state.players.forEach((p) => {
    playerTeams[p.id] = p.team;
  });

  let selectedCard: Card | undefined;
  try {
    selectedCard = selectBotCard(
      botHand,
      room.state.tableCards,
      room.state.briscolaCard?.suit || 'denari',
      currentTurnPlayer.botDifficulty || 'medium',
      currentTurnPlayer.team,
      playerTeams
    );
  } catch (err) {
    console.error(`Error in selectBotCard for ${botId}:`, err);
  }

  // Fallback to first card in hand if selection failed or returned card not in hand
  if (!selectedCard || !botHand.some((c) => c.id === selectedCard?.id)) {
    selectedCard = botHand[0];
  }

  if (selectedCard) {
    handlePlayCard(roomId, botId, selectedCard.id);
  }
}

// Play card handler
function handlePlayCard(roomId: string, playerId: string, cardId: string) {
  const room = rooms.get(roomId);
  if (!room || room.state.status !== 'playing') return;

  // Block any play if the table already has a full trick pending resolution
  if (room.state.tableCards.length >= room.state.players.length) {
    return;
  }

  if (room.state.currentTurnPlayerId !== playerId) {
    return; // Not this player's turn
  }

  const hand = room.playerHands.get(playerId) || [];
  const cardIndex = hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) {
    console.error(`Card ${cardId} not found in hand for player ${playerId}`);
    return;
  }

  const [playedCard] = hand.splice(cardIndex, 1);
  room.playerHands.set(playerId, hand);

  const playedItem: PlayedCard = {
    playerId,
    card: playedCard,
    playedAt: Date.now(),
  };

  room.state.tableCards.push(playedItem);

  const requiredCount = room.state.players.length;

  if (room.state.tableCards.length < requiredCount) {
    // Advance turn to next player in player array
    const playerIndex = room.state.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return;
    const nextPlayerIndex = (playerIndex + 1) % requiredCount;
    const nextPlayer = room.state.players[nextPlayerIndex];

    room.state.currentTurnPlayerId = nextPlayer.id;
    broadcastRoomState(roomId);
    scheduleBotTurn(roomId);
  } else {
    // Trick is complete! Clear bot timers during resolution
    room.botTimers.forEach((t) => clearTimeout(t));
    room.botTimers.clear();
    room.lastTrickResolvedAt = Date.now();

    broadcastRoomState(roomId);

    setTimeout(() => {
      resolveTrick(roomId);
    }, 1800);
  }
}

function resolveTrick(roomId: string) {
  const room = rooms.get(roomId);
  if (!room || room.state.status !== 'playing') return;

  // Clear any leftover bot timers to avoid race conditions
  room.botTimers.forEach((t) => clearTimeout(t));
  room.botTimers.clear();

  try {
    if (room.state.tableCards.length === 0) return;

    const briscolaSuit = room.state.briscolaCard?.suit || 'denari';
    const winnerPlay = evaluateTrick(room.state.tableCards, briscolaSuit);
    const winnerPlayer = room.state.players.find((p) => p.id === winnerPlay.playerId);

    if (!winnerPlayer) {
      console.error('Winner player not found during trick evaluation');
      room.state.tableCards = [];
      broadcastRoomState(roomId);
      return;
    }

    const points = calculateTrickPoints(room.state.tableCards);

    winnerPlayer.pointsWon += points;
    winnerPlayer.tricksWonCount += 1;

    if (winnerPlayer.team === 1) {
      room.state.team1Score += points;
    } else {
      room.state.team2Score += points;
    }

    room.state.lastTrick = {
      winnerId: winnerPlayer.id,
      cards: [...room.state.tableCards],
      points,
    };

    room.state.tableCards = [];

    // Draw 1 card from deck for each player starting from the trick winner
    const winnerSeat = winnerPlayer.seatIndex ?? 0;
    const playerCount = room.state.players.length;

    for (let i = 0; i < playerCount; i++) {
      const seat = (winnerSeat + i) % playerCount;
      const player = room.state.players.find((p) => p.seatIndex === seat);

      if (player && room.deck.length > 0) {
        const drawnCard = room.deck.shift()!;
        const hand = room.playerHands.get(player.id) || [];
        hand.push(drawnCard);
        room.playerHands.set(player.id, hand);
      }
    }

    room.state.deckCount = room.deck.length;
    room.state.currentTurnPlayerId = winnerPlayer.id;
    room.state.leadPlayerId = winnerPlayer.id;

    // Check if round ended (no cards in deck and all hands empty)
    let totalCardsInHands = 0;
    room.playerHands.forEach((hand) => {
      totalCardsInHands += hand.length;
    });

    if (room.deck.length === 0 && totalCardsInHands === 0) {
      // Round Finished!
      let roundWinnerTeam: 1 | 2 | 0 = 0;
      if (room.state.team1Score > room.state.team2Score) {
        roundWinnerTeam = 1;
      } else if (room.state.team2Score > room.state.team1Score) {
        roundWinnerTeam = 2;
      }

      room.state.roundWinnerTeam = roundWinnerTeam;
      room.state.status = 'round_ended';

      room.state.history.push({
        round: room.state.currentRound,
        team1Points: room.state.team1Score,
        team2Points: room.state.team2Score,
        winnerTeam: roundWinnerTeam,
      });

      if (room.state.team1Score >= room.state.maxPoints) {
        room.state.matchWinnerTeam = 1;
        room.state.status = 'match_ended';
      } else if (room.state.team2Score >= room.state.maxPoints) {
        room.state.matchWinnerTeam = 2;
        room.state.status = 'match_ended';
      }

      broadcastRoomState(roomId);
    } else {
      broadcastRoomState(roomId);
      scheduleBotTurn(roomId);
    }
  } catch (err) {
    console.error('Error in resolveTrick:', err);
    // Fallback recovery: reset table state and proceed
    room.state.tableCards = [];
    broadcastRoomState(roomId);
    scheduleBotTurn(roomId);
  }
}

function startRound(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const rawDeck = createDeck();
  const shuffled = shuffleDeck(rawDeck);

  // Briscola card is the last card in the deck, turned face up
  const briscolaCard = shuffled[shuffled.length - 1];

  room.deck = shuffled;
  room.state.briscolaCard = briscolaCard;
  room.state.tableCards = [];
  room.state.lastTrick = null;
  room.state.status = 'playing';

  // Deal 3 cards to each player
  room.state.players.forEach((player) => {
    const hand = room.deck.splice(0, 3);
    room.playerHands.set(player.id, hand);
    player.pointsWon = 0;
    player.tricksWonCount = 0;
  });

  room.state.deckCount = room.deck.length;
  room.state.team1Score = 0;
  room.state.team2Score = 0;
  room.state.roundWinnerTeam = null;

  // Lead player is seat 0
  const leadPlayer = room.state.players.find((p) => p.seatIndex === 0)!;
  room.state.currentTurnPlayerId = leadPlayer.id;
  room.state.leadPlayerId = leadPlayer.id;

  broadcastRoomState(roomId);
  scheduleBotTurn(roomId);
}

// WebSocket Server Events
wss.on('connection', (ws: ExtendedWebSocket) => {
  ws.isAlive = true;

  ws.on('message', (rawData) => {
    try {
      const msg: WSMessage = JSON.parse(rawData.toString());

      if (msg.type === 'join_room') {
        const roomId = (msg.roomId || 'MAIN').toUpperCase();
        const playerName = msg.playerName?.trim() || 'Giocatore';
        const playerId = msg.playerId || `p_${Math.random().toString(36).substring(2, 9)}`;
        const mode: GameMode = msg.mode || '1v1';

        ws.roomId = roomId;
        ws.playerId = playerId;

        let room = rooms.get(roomId);
        if (!room) {
          const maxPoints = 61; // Standard Briscola win score
          const initialPlayers: Player[] = [];
          const state: GameState = {
            roomId,
            mode,
            status: 'waiting',
            maxPoints,
            currentRound: 1,
            players: initialPlayers,
            briscolaCard: null,
            deckCount: 40,
            currentTurnPlayerId: '',
            leadPlayerId: '',
            tableCards: [],
            lastTrick: null,
            team1Score: 0,
            team2Score: 0,
            roundWinnerTeam: null,
            matchWinnerTeam: null,
            history: [],
            turnDeadline: null,
          };

          room = {
            state,
            deck: [],
            playerHands: new Map(),
            sockets: new Map(),
            botTimers: new Map(),
          };
          rooms.set(roomId, room);
        }

        room.sockets.set(playerId, ws);

        let player = room.state.players.find((p) => p.id === playerId);
        const maxPlayers = room.state.mode === '1v1' ? 2 : 4;

        if (!player) {
          if (room.state.players.length >= maxPlayers && room.state.status !== 'waiting') {
            ws.send(JSON.stringify({ type: 'error', message: 'La stanza è piena!' }));
            return;
          }

          const seatIndex = room.state.players.length;
          // Team 1: seats 0 & 2. Team 2: seats 1 & 3.
          const team: 1 | 2 = seatIndex % 2 === 0 ? 1 : 2;
          const isHost = room.state.players.length === 0;

          const avatarColors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B'];

          player = {
            id: playerId,
            name: playerName,
            avatar: avatarColors[seatIndex % avatarColors.length],
            isHost,
            isBot: false,
            team,
            seatIndex,
            isConnected: true,
            cardsCount: 0,
            pointsWon: 0,
            tricksWonCount: 0,
          };

          room.state.players.push(player);
          room.playerHands.set(playerId, []);
        } else {
          player.isConnected = true;
          player.name = playerName;
        }

        broadcastRoomState(roomId);
      } else if (msg.type === 'add_bot') {
        const roomId = ws.roomId;
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (!room || room.state.status !== 'waiting') return;

        const maxPlayers = room.state.mode === '1v1' ? 2 : 4;
        if (room.state.players.length >= maxPlayers) return;

        const seatIndex = room.state.players.length;
        const botId = `bot_${Date.now()}_${seatIndex}`;
        const team: 1 | 2 = seatIndex % 2 === 0 ? 1 : 2;
        const botNames = ['Bot Marco', 'Bot Sofia', 'Bot Luigi', 'Bot Elena'];
        const avatarColors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B'];

        const botPlayer: Player = {
          id: botId,
          name: botNames[seatIndex % botNames.length],
          avatar: avatarColors[seatIndex % avatarColors.length],
          isHost: false,
          isBot: true,
          botDifficulty: msg.botDifficulty || 'medium',
          team,
          seatIndex,
          isConnected: true,
          cardsCount: 0,
          pointsWon: 0,
          tricksWonCount: 0,
        };

        room.state.players.push(botPlayer);
        room.playerHands.set(botId, []);
        broadcastRoomState(roomId);
      } else if (msg.type === 'remove_bot') {
        const roomId = ws.roomId;
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (!room || room.state.status !== 'waiting') return;

        const botIndex = room.state.players.findIndex((p) => p.isBot);
        if (botIndex !== -1) {
          const [removedBot] = room.state.players.splice(botIndex, 1);
          room.playerHands.delete(removedBot.id);
          // Re-index seats
          room.state.players.forEach((p, idx) => {
            p.seatIndex = idx;
            p.team = idx % 2 === 0 ? 1 : 2;
          });
          broadcastRoomState(roomId);
        }
      } else if (msg.type === 'start_game') {
        const roomId = ws.roomId;
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (!room) return;

        const maxPlayers = room.state.mode === '1v1' ? 2 : 4;
        if (room.state.players.length < maxPlayers) {
          // Auto fill with bots if needed
          while (room.state.players.length < maxPlayers) {
            const seatIndex = room.state.players.length;
            const botId = `bot_${Date.now()}_${seatIndex}`;
            const team: 1 | 2 = seatIndex % 2 === 0 ? 1 : 2;
            const botNames = ['Bot Marco', 'Bot Sofia', 'Bot Luigi', 'Bot Elena'];
            const avatarColors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B'];

            room.state.players.push({
              id: botId,
              name: botNames[seatIndex % botNames.length],
              avatar: avatarColors[seatIndex % avatarColors.length],
              isHost: false,
              isBot: true,
              botDifficulty: 'medium',
              team,
              seatIndex,
              isConnected: true,
              cardsCount: 0,
              pointsWon: 0,
              tricksWonCount: 0,
            });
            room.playerHands.set(botId, []);
          }
        }

        room.state.currentRound = 1;
        startRound(roomId);
      } else if (msg.type === 'play_card') {
        const roomId = ws.roomId;
        const playerId = ws.playerId;
        if (!roomId || !playerId || !msg.cardId) return;

        handlePlayCard(roomId, playerId, msg.cardId);
      } else if (msg.type === 'send_reaction') {
        const roomId = ws.roomId;
        const playerId = ws.playerId;
        if (!roomId || !playerId || !msg.reaction) return;

        broadcastToRoom(roomId, {
          type: 'reaction_broadcast',
          playerId,
          reaction: msg.reaction,
        });
      } else if (msg.type === 'chat_message') {
        const roomId = ws.roomId;
        const playerId = ws.playerId;
        if (!roomId || !playerId || !msg.chatText) return;

        const room = rooms.get(roomId);
        const player = room?.state.players.find((p) => p.id === playerId);

        broadcastToRoom(roomId, {
          type: 'chat_broadcast',
          playerId,
          playerName: player?.name || 'Giocatore',
          chatText: msg.chatText,
        });
      } else if (msg.type === 'rematch') {
        const roomId = ws.roomId;
        if (!roomId) return;
        const room = rooms.get(roomId);
        if (!room) return;

        room.state.currentRound += 1;
        startRound(roomId);
      } else if (msg.type === 'leave_room') {
        const roomId = ws.roomId;
        const playerId = ws.playerId;
        if (roomId && playerId) {
          const room = rooms.get(roomId);
          if (room) {
            room.sockets.delete(playerId);
            if (room.state.status === 'waiting') {
              const playerIndex = room.state.players.findIndex((p) => p.id === playerId);
              if (playerIndex !== -1) {
                const wasHost = room.state.players[playerIndex].isHost;
                room.state.players.splice(playerIndex, 1);
                // Re-index seats
                room.state.players.forEach((p, idx) => {
                  p.seatIndex = idx;
                  p.team = idx % 2 === 0 ? 1 : 2;
                });
                if (wasHost && room.state.players.length > 0) {
                  const nextHuman = room.state.players.find((p) => !p.isBot);
                  if (nextHuman) {
                    nextHuman.isHost = true;
                  } else {
                    room.state.players[0].isHost = true;
                  }
                }
              }
            } else {
              const player = room.state.players.find((p) => p.id === playerId);
              if (player) {
                player.isConnected = false;
              }
            }

            ws.roomId = undefined;
            ws.playerId = undefined;

            const hasHumanPlayers = room.state.players.some((p) => !p.isBot && p.isConnected);
            if (!hasHumanPlayers) {
              room.botTimers.forEach((t) => clearTimeout(t));
              rooms.delete(roomId);
            } else {
              broadcastRoomState(roomId);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error processing WS message:', err);
    }
  });

  ws.on('close', () => {
    const roomId = ws.roomId;
    const playerId = ws.playerId;

    if (roomId && playerId) {
      const room = rooms.get(roomId);
      if (room) {
        room.sockets.delete(playerId);
        const player = room.state.players.find((p) => p.id === playerId);
        if (player) {
          player.isConnected = false;
        }

        // Check if all players left
        const hasHumanPlayers = room.state.players.some((p) => !p.isBot && p.isConnected);
        if (!hasHumanPlayers) {
          // Clean up room after 1 minute if empty
          setTimeout(() => {
            const currentRoom = rooms.get(roomId);
            if (currentRoom) {
              const stillEmpty = !currentRoom.state.players.some((p) => !p.isBot && p.isConnected);
              if (stillEmpty) {
                // Clear bot timers
                currentRoom.botTimers.forEach((t) => clearTimeout(t));
                rooms.delete(roomId);
              }
            }
          }, 60000);
        } else {
          broadcastRoomState(roomId);
        }
      }
    }
  });
});

// Vite Middleware Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎴 Server Briscola avviato su http://localhost:${PORT}`);
  });
}

startServer();
