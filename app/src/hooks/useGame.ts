import { useState, useCallback } from 'react';
import type { Place, GameState } from '../types/game';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function useGame() {
  const [state, setState] = useState<GameState>({
    currentPlace: null,
    score: 0,
    lastResult: null,
    showNext: false,
    isLoading: true,
  });

  const loadNewQuestion = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, lastResult: null, showNext: false }));
      const response = await fetch(`${API_BASE}/random`);
      const data: Place = await response.json();
      setState(prev => ({
        ...prev,
        currentPlace: data,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load question:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const submitGuess = useCallback(async (guess: string) => {
    const { currentPlace } = state;
    if (!currentPlace) return;

    try {
      const response = await fetch(`${API_BASE}/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kanji: currentPlace.kanji,
          guess: guess,
        }),
      });
      const result = await response.json();

      if (result.result === 'correct') {
        setState(prev => ({
          ...prev,
          score: prev.score + 1,
          lastResult: 'correct' as const,
        }));

        // Auto-advance after 2 seconds
        setTimeout(() => {
          loadNewQuestion();
        }, 2000);
      } else {
        setState(prev => ({ ...prev, lastResult: 'incorrect' as const }));
      }
    } catch (error) {
      console.error('Failed to submit guess:', error);
    }
  }, [state, loadNewQuestion]);

  const submitKanjiGuess = useCallback(async (guess: string) => {
    const { currentPlace } = state;
    if (!currentPlace) return;

    try {
      const response = await fetch(`${API_BASE}/guess-kanji`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kana: currentPlace.hiragana, guess }),
      });
      const result = await response.json();

      if (result.result === 'correct') {
        setState(prev => ({ ...prev, score: prev.score + 1, lastResult: 'correct' as const }));
        setTimeout(() => loadNewQuestion(), 2000);
      } else {
        setState(prev => ({ ...prev, lastResult: 'incorrect' as const }));
      }
    } catch (error) {
      console.error('Failed to submit kanji guess:', error);
    }
  }, [state, loadNewQuestion]);

  const giveUp = useCallback(() => {
    setState(prev => ({ ...prev, showNext: true, lastResult: null }));
  }, []);

  const nextQuestion = useCallback(() => {
    loadNewQuestion();
  }, [loadNewQuestion]);

  const clearResult = useCallback(() => {
    setState(prev => ({ ...prev, lastResult: null }));
  }, []);

  return {
    ...state,
    loadNewQuestion,
    submitGuess,
    submitKanjiGuess,
    giveUp,
    nextQuestion,
    clearResult,
  };
}
