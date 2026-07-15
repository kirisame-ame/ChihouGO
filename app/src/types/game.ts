export interface Place {
  questionId: string;
  kanji?: string;
  admLevel: string;
  latitude: number;
  longitude: number;
  hiragana?: string;
  romaji?: string;
  admLevelKana: string;
}

export interface GameState {
  currentPlace: Place | null;
  score: number;
  lastResult: "correct" | "incorrect" | null;
  showNext: boolean;
  isLoading: boolean;
}
