export interface CardType {
  id: string;
  emoji: string;
  isMatched: boolean;
  isFlipped: boolean;
}

export enum GameState {
  MENU = 'MENU',
  PLAYER_SETUP = 'PLAYER_SETUP',
  MODE_SELECTION = 'MODE_SELECTION',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface PlayerProfile {
  id: number;
  name: string;
  score: number;
  theme: 'indigo' | 'pink' | 'orange' | 'emerald';
}
