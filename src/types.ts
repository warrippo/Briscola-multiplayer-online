export type Suit = 'coppe' | 'denari' | 'bastoni' | 'spade';

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Card {
  id: string; // e.g., 'coppe_1'
  suit: Suit;
  rank: Rank;
  points: number; // 11, 10, 4, 3, 2, 0
  hierarchy: number; // 1 to 10
  name: string; // e.g. "Asso", "3", "Re", "Cavallo", "Fante", etc.
}

export type GameMode = '1v1' | '2v2';

export interface Player {
  id: string;
  name: string;
  avatar: string; // e.g. avatar color or icon string
  isHost: boolean;
  isBot: boolean;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  team: 1 | 2; // Team 1: seats 0 & 2, Team 2: seats 1 & 3
  seatIndex: number; // 0, 1, 2, 3
  isConnected: boolean;
  cardsCount: number;
  pointsWon: number;
  tricksWonCount: number;
}

export interface PlayedCard {
  playerId: string;
  card: Card;
  playedAt: number;
}

export type GameStatus = 'waiting' | 'playing' | 'round_ended' | 'match_ended';

export interface GameState {
  roomId: string;
  mode: GameMode;
  status: GameStatus;
  maxPoints: number; // e.g. 61 for single round or match target
  currentRound: number;
  players: Player[];
  briscolaCard: Card | null;
  deckCount: number;
  currentTurnPlayerId: string;
  leadPlayerId: string;
  tableCards: PlayedCard[]; // cards played in the current trick
  lastTrick: {
    winnerId: string;
    cards: PlayedCard[];
    points: number;
  } | null;
  team1Score: number; // Cumulative total points
  team2Score: number;
  roundWinnerTeam: 1 | 2 | 0 | null; // 0 = draw
  matchWinnerTeam: 1 | 2 | null;
  history: {
    round: number;
    team1Points: number;
    team2Points: number;
    winnerTeam: 1 | 2 | 0;
  }[];
  turnDeadline: number | null; // Timestamp for turn timer
}

// WebSocket Message Interfaces
export type WSMessageType =
  | 'join_room'
  | 'leave_room'
  | 'room_state'
  | 'your_hand'
  | 'play_card'
  | 'add_bot'
  | 'remove_bot'
  | 'toggle_ready'
  | 'start_game'
  | 'send_reaction'
  | 'chat_message'
  | 'reaction_broadcast'
  | 'chat_broadcast'
  | 'rematch'
  | 'error';

export interface WSMessage {
  type: WSMessageType;
  roomId?: string;
  playerId?: string;
  playerName?: string;
  mode?: GameMode;
  cardId?: string;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  reaction?: string;
  chatText?: string;
  state?: GameState;
  hand?: Card[];
  message?: string;
  seatIndex?: number;
}
