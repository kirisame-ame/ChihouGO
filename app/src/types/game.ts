export interface Place {
  kanji: string;
  latitude: number;
  longitude: number;
  hiragana: string;
  romaji: string;
}

export interface GameState {
  currentPlace: Place | null;
  score: number;
  lastResult: 'correct' | 'incorrect' | null;
  showNext: boolean;
  isLoading: boolean;
}
