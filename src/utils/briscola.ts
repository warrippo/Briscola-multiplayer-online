import { Card, PlayedCard, Rank, Suit } from '../types';

export const SUITS: { id: Suit; name: string; color: string; symbol: string; desc: string }[] = [
  { id: 'denari', name: 'Denari', color: '#EAB308', symbol: '🪙', desc: 'Monete d’oro' },
  { id: 'coppe', name: 'Coppe', color: '#EF4444', symbol: '🏆', desc: 'Calici d’oro' },
  { id: 'bastoni', name: 'Bastoni', color: '#8B5CF6', symbol: '🪵', desc: 'Bastoni di legno' },
  { id: 'spade', name: 'Spade', color: '#3B82F6', symbol: '⚔️', desc: 'Spade in acciaio' },
];

export const RANK_INFO: Record<Rank, { name: string; shortName: string; points: number; hierarchy: number }> = {
  1: { name: 'Asso', shortName: 'A', points: 11, hierarchy: 10 },
  3: { name: 'Tre', shortName: '3', points: 10, hierarchy: 9 },
  10: { name: 'Re', shortName: '10', points: 4, hierarchy: 8 },
  9: { name: 'Cavallo', shortName: '9', points: 3, hierarchy: 7 },
  8: { name: 'Fante', shortName: '8', points: 2, hierarchy: 6 },
  7: { name: 'Sette', shortName: '7', points: 0, hierarchy: 5 },
  6: { name: 'Sei', shortName: '6', points: 0, hierarchy: 4 },
  5: { name: 'Cinque', shortName: '5', points: 0, hierarchy: 3 },
  4: { name: 'Quattro', shortName: '4', points: 0, hierarchy: 2 },
  2: { name: 'Due', shortName: '2', points: 0, hierarchy: 1 },
};

export const ALL_RANKS: Rank[] = [1, 3, 10, 9, 8, 7, 6, 5, 4, 2];

/**
 * Generate a complete 40-card Italian Briscola Deck
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suitObj of SUITS) {
    const suit = suitObj.id;
    for (const rank of ALL_RANKS) {
      const info = RANK_INFO[rank];
      deck.push({
        id: `${suit}_${rank}`,
        suit,
        rank,
        points: info.points,
        hierarchy: info.hierarchy,
        name: `${info.name} di ${suitObj.name}`,
      });
    }
  }

  return deck;
}

/**
 * Fisher-Yates deck shuffle
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Evaluate who wins a trick (presa)
 */
export function evaluateTrick(playedCards: PlayedCard[], briscolaSuit: Suit): PlayedCard {
  if (playedCards.length === 0) {
    throw new Error('No cards played');
  }

  const leadCard = playedCards[0].card;
  let winningPlay = playedCards[0];

  for (let i = 1; i < playedCards.length; i++) {
    const currentPlay = playedCards[i];
    const currentCard = currentPlay.card;
    const winningCard = winningPlay.card;

    const isCurrentBriscola = currentCard.suit === briscolaSuit;
    const isWinningBriscola = winningCard.suit === briscolaSuit;

    if (isCurrentBriscola && !isWinningBriscola) {
      // Current card is Briscola and winning card is not -> current wins
      winningPlay = currentPlay;
    } else if (isCurrentBriscola && isWinningBriscola) {
      // Both are Briscola -> higher hierarchy wins
      if (currentCard.hierarchy > winningCard.hierarchy) {
        winningPlay = currentPlay;
      }
    } else if (!isWinningBriscola) {
      // Neither is Briscola -> current wins if it matches lead suit AND has higher hierarchy than winning card
      if (currentCard.suit === leadCard.suit) {
        if (winningCard.suit !== leadCard.suit || currentCard.hierarchy > winningCard.hierarchy) {
          winningPlay = currentPlay;
        }
      }
    }
  }

  return winningPlay;
}

/**
 * Calculate total points in a trick
 */
export function calculateTrickPoints(playedCards: PlayedCard[]): number {
  return playedCards.reduce((sum, item) => sum + item.card.points, 0);
}

/**
 * AI Bot Card Selection Engine
 */
export function selectBotCard(
  botHand: Card[],
  tableCards: PlayedCard[],
  briscolaSuit: Suit,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  myTeam: 1 | 2 = 1,
  playerTeams: Record<string, 1 | 2> = {}
): Card {
  if (botHand.length === 0) return botHand[0];
  if (botHand.length === 1) return botHand[0];

  // Easy difficulty: random card
  if (difficulty === 'easy') {
    const randomIndex = Math.floor(Math.random() * botHand.length);
    return botHand[randomIndex];
  }

  // Medium / Hard Logic
  if (tableCards.length === 0) {
    // Lead turn: Bot starts trick
    // Sort hand by value (non-briscola low hierarchy first)
    const sorted = [...botHand].sort((a, b) => {
      const aIsBriscola = a.suit === briscolaSuit;
      const bIsBriscola = b.suit === briscolaSuit;
      if (aIsBriscola && !bIsBriscola) return 1;
      if (!aIsBriscola && bIsBriscola) return -1;
      // If same briscola status, prefer lowest points/hierarchy first
      if (a.points !== b.points) return a.points - b.points;
      return a.hierarchy - b.hierarchy;
    });
    return sorted[0];
  }

  // Table already has cards played
  const currentWinner = evaluateTrick(tableCards, briscolaSuit);
  const currentWinnerTeam = playerTeams[currentWinner.playerId] || 1;
  const partnerIsWinning = currentWinnerTeam === myTeam;
  const pointsOnTable = calculateTrickPoints(tableCards);

  // If partner is currently winning the trick with a strong card or high point value:
  if (partnerIsWinning) {
    if (difficulty === 'hard' && pointsOnTable >= 10) {
      // Throw points (carico) if partner is winning with high card / briscola!
      const pointCards = botHand.filter((c) => c.suit !== briscolaSuit && c.points > 0);
      if (pointCards.length > 0) {
        pointCards.sort((a, b) => b.points - a.points); // highest points first
        return pointCards[0];
      }
    }
    // Otherwise play lowest card
    const lowest = [...botHand].sort((a, b) => {
      if (a.suit === briscolaSuit && b.suit !== briscolaSuit) return 1;
      if (a.suit !== briscolaSuit && b.suit === briscolaSuit) return -1;
      return a.hierarchy - b.hierarchy;
    });
    return lowest[0];
  }

  // Partner is NOT winning (opponent is winning or solo game)
  // Try to find cards in hand that beat the current winner
  const winningCards: Card[] = [];
  for (const card of botHand) {
    const testTrick = [...tableCards, { playerId: 'bot', card, playedAt: Date.now() }];
    const testWinner = evaluateTrick(testTrick, briscolaSuit);
    if (testWinner.playerId === 'bot') {
      winningCards.push(card);
    }
  }

  if (winningCards.length > 0) {
    // If there are high points on table (Asso, 3, etc.) or if it's the last turn
    if (pointsOnTable >= 10 || difficulty === 'hard') {
      // Choose the winning card that uses the minimum necessary resource (lowest winning briscola or lowest winning lead-suit)
      winningCards.sort((a, b) => {
        const aIsBriscola = a.suit === briscolaSuit;
        const bIsBriscola = b.suit === briscolaSuit;
        if (aIsBriscola && !bIsBriscola) return 1;
        if (!aIsBriscola && bIsBriscola) return -1;
        return a.hierarchy - b.hierarchy;
      });
      return winningCards[0];
    }
  }

  // Cannot or choose not to win: play lowest non-briscola card (scartina)
  const scartine = botHand.filter((c) => c.suit !== briscolaSuit);
  if (scartine.length > 0) {
    scartine.sort((a, b) => {
      if (a.points !== b.points) return a.points - b.points;
      return a.hierarchy - b.hierarchy;
    });
    return scartine[0];
  }

  // Only Briscolas left: play lowest Briscola
  const briscolas = [...botHand].sort((a, b) => a.hierarchy - b.hierarchy);
  return briscolas[0];
}

/**
 * Web Audio Sound Synthesizer (No external MP3 files needed!)
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCardPlay() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // White noise burst for card slide/slap
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start(now);
  }

  playTrickWin() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Pleasant multi-tone arpeggio (Italian accordion vibe)
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.06);

      gain.gain.setValueAtTime(0.15, now + index * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + index * 0.06);
      osc.stop(now + index * 0.06 + 0.25);
    });
  }

  playGameWin() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const chords = [
      [523.25, 659.25, 783.99], // C Major
      [587.33, 698.46, 880.0],  // D minor
      [659.25, 783.99, 987.77],  // E minor
      [1046.5, 1318.5, 1567.98]  // C Major High
    ];

    chords.forEach((chord, step) => {
      chord.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + step * 0.18);
        gain.gain.setValueAtTime(0.12, now + step * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, now + step * 0.18 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + step * 0.18);
        osc.stop(now + step * 0.18 + 0.4);
      });
    });
  }

  playShuffle() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.playCardPlay();
      }, i * 40);
    }
  }
}

export const sounds = new SoundSynthesizer();
