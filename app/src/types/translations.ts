export const translations = {
  en: {
    title: "ChihouGO : Place Kanji Reading Game!",
    guess: "Enter your guess",
    correct: "Correct!",
    wrong: "Wrong guess, try again!",
    answer: "The answer was",
    giveup: "Give up",
    next: "Next",
    submit: "Submit",
    score: "Score: ",
    loading: "Loading...",
    devBy: "by",
    hepburnNote: "※Hepburn Romaji e.g. とうきょう -> toukyou",
    hiraganaRomaji: "ひらがな / Romaji",
  },
  ja: {
    title: "地方GO：地名漢字の読み方クイズ！",
    guess: "答えを入力してください",
    correct: "正解！",
    wrong: "間違った答えです。もう一度試してください！",
    answer: "答えは",
    giveup: "あきらめる",
    next: "次へ",
    submit: "提出",
    score: "スコア: ",
    loading: "読み込み中...",
    devBy: "作者",
    hepburnNote: "※ヘボン式ローマ字 例: とうきょう -> toukyou",
    hiraganaRomaji: "ひらがな / ローマ字",
  },
} as const;

export type Language = keyof typeof translations;
