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

  const loadNewQuestion = useCallback(async (mode: 'reading' | 'draw' = 'reading') => {
    try {
      setState(prev => ({ ...prev, isLoading: true, lastResult: null, showNext: false }));
      const response = await fetch(`${API_BASE}/random?mode=${mode}`);
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
          questionId: currentPlace.questionId,
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
          loadNewQuestion('reading');
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
        body: JSON.stringify({
          questionId: currentPlace.questionId,
          kana: currentPlace.hiragana,
          guess,
        }),
      });
      const result = await response.json();

      if (result.result === 'correct') {
        setState(prev => ({ ...prev, score: prev.score + 1, lastResult: 'correct' as const }));
        setTimeout(() => loadNewQuestion('draw'), 2000);
      } else {
        setState(prev => ({ ...prev, lastResult: 'incorrect' as const }));
      }
    } catch (error) {
      console.error('Failed to submit kanji guess:', error);
    }
  }, [state, loadNewQuestion]);

  const giveUp = useCallback(async () => {
    const { currentPlace } = state;
    if (!currentPlace) return;

    try {
      const response = await fetch(`${API_BASE}/giveup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: currentPlace.questionId }),
      });
      const answer = await response.json();

      if (!response.ok) throw new Error(answer.error || 'Failed to give up');

      setState(prev => ({
        ...prev,
        currentPlace: { ...prev.currentPlace!, ...answer },
        showNext: true,
        lastResult: null,
      }));
    } catch (error) {
      console.error('Failed to reveal answer:', error);
    }
  }, [state]);

  const nextQuestion = useCallback((mode: 'reading' | 'draw' = 'reading') => {
    loadNewQuestion(mode);
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
