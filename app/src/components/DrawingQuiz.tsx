import { useCallback, useEffect, useRef, useState } from "react";
import { DrawingCanvas, type DrawingCanvasRef } from "./DrawingCanvas";
import {
    useCharClassifier,
    type ClassifierResult,
} from "../hooks/useCharClassifier";

interface DrawingBox {
    id: number;
    candidates: ClassifierResult[];
    selected: ClassifierResult | null;
}

interface DrawingQuizProps {
    questionKey: string;
    isDisabled: boolean;
    onCheck: (guess: string) => void;
    onGiveUp: () => void;
    labels: {
        drawInstructions: string;
        addBox: string;
        character: string;
        clear: string;
        remove: string;
        loadingClassifier: string;
        classifierError: string;
        recognizeDrawings: string;
        recognizing: string;
        checkDrawingAnswer: string;
        giveup: string;
    };
}

export function DrawingQuiz({
    questionKey,
    isDisabled,
    onCheck,
    onGiveUp,
    labels,
}: DrawingQuizProps) {
    const canvasRefs = useRef(new Map<number, DrawingCanvasRef>());
    const nextBoxId = useRef(1);
    const [boxes, setBoxes] = useState<DrawingBox[]>([]);
    const [isClassifying, setIsClassifying] = useState(false);
    const { classify, isModelLoaded, isLoading, error } = useCharClassifier();

    useEffect(() => {
        nextBoxId.current = 1;
        setBoxes([]);
    }, [questionKey]);

    const addBox = () => {
        setBoxes((current) => [
            ...current,
            { id: nextBoxId.current++, candidates: [], selected: null },
        ]);
    };

    const removeBox = (id: number) => {
        setBoxes((current) =>
            current.length === 1
                ? current
                : current.filter((box) => box.id !== id),
        );
    };

    const clearBox = (id: number) => {
        canvasRefs.current.get(id)?.clear();
        invalidateBox(id);
    };

    const invalidateBox = (id: number) => {
        setBoxes((current) =>
            current.map((box) =>
                box.id === id
                    ? { ...box, candidates: [], selected: null }
                    : box,
            ),
        );
    };

    const classifyDrawings = useCallback(async () => {
        if (!isModelLoaded) return;

        setIsClassifying(true);
        const candidatesById = new Map<number, ClassifierResult[] | null>();

        // onnxruntime-web sessions accept one inference at a time.
        for (const box of boxes) {
            const canvas = canvasRefs.current.get(box.id)?.getCanvas();
            candidatesById.set(box.id, canvas ? await classify(canvas) : null);
        }

        setBoxes((current) =>
            current.map((box) => ({
                ...box,
                candidates: candidatesById.get(box.id) ?? [],
                selected: null,
            })),
        );
        setIsClassifying(false);
    }, [boxes, classify, isModelLoaded]);

    const selectCandidate = (boxId: number, candidate: ClassifierResult) => {
        setBoxes((current) =>
            current.map((box) =>
                box.id === boxId ? { ...box, selected: candidate } : box,
            ),
        );
    };

    const allCharactersSelected =
        boxes.length > 0 && boxes.every((box) => box.selected !== null);

    return (
        <section className="mt-4" aria-label="Kanji drawing answer">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-neutral-400">
                    {labels.drawInstructions}
                </p>
                <button
                    type="button"
                    onClick={addBox}
                    disabled={isDisabled}
                    className="h-8 shrink-0 rounded border border-neutral-600 bg-neutral-800 px-3 text-sm text-neutral-100 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {labels.addBox}
                </button>
            </div>
            <p className="text-sm text-neutral-400">
                Character recognition powered by machine learning from Dariyooo
                (DaAppLab)
            </p>
            {isLoading && (
                <p className="mt-3 text-sm text-yellow-400">
                    {labels.loadingClassifier}
                </p>
            )}
            {error && (
                <p className="mt-3 text-sm text-red-400">
                    {labels.classifierError}: {error}
                </p>
            )}

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {boxes.map((box, index) => (
                    <div key={box.id} className="border border-neutral-700 p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-neutral-300">
                                {labels.character} {index + 1}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => clearBox(box.id)}
                                    disabled={isDisabled}
                                    className="text-xs text-neutral-400 hover:text-white disabled:opacity-50"
                                >
                                    {labels.clear}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeBox(box.id)}
                                    disabled={isDisabled || boxes.length === 1}
                                    className="text-xs text-red-300 hover:text-red-200 disabled:opacity-50"
                                >
                                    {labels.remove}
                                </button>
                            </div>
                        </div>
                        <DrawingCanvas
                            ref={(node) => {
                                if (node) canvasRefs.current.set(box.id, node);
                                else canvasRefs.current.delete(box.id);
                            }}
                            width={160}
                            height={160}
                            lineWidth={6}
                            lineColor="white"
                            backgroundColor="black"
                            onDraw={() => {
                                if (box.candidates.length > 0)
                                    invalidateBox(box.id);
                            }}
                        />

                        {box.candidates.length > 0 && (
                            <div className="mt-3 grid grid-cols-5 gap-1">
                                {box.candidates.map((candidate) => {
                                    const isSelected =
                                        box.selected?.classIndex ===
                                        candidate.classIndex;
                                    return (
                                        <button
                                            key={candidate.classIndex}
                                            type="button"
                                            aria-label={`Choose ${candidate.className}`}
                                            aria-pressed={isSelected}
                                            onClick={() =>
                                                selectCandidate(
                                                    box.id,
                                                    candidate,
                                                )
                                            }
                                            disabled={isDisabled}
                                            className={`flex min-h-14 flex-col items-center justify-center border text-sm transition-colors disabled:opacity-50 ${
                                                isSelected
                                                    ? "border-cyan-400 bg-cyan-950 text-cyan-200"
                                                    : "border-neutral-600 bg-neutral-900 text-neutral-100 hover:border-cyan-500"
                                            }`}
                                        >
                                            <span className="text-2xl leading-none">
                                                {candidate.className}
                                            </span>
                                            <span className="mt-1 text-[10px] text-neutral-400">
                                                {(
                                                    candidate.confidence * 100
                                                ).toFixed(0)}
                                                %
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-4 flex justify-center gap-2">
                <button
                    type="button"
                    onClick={classifyDrawings}
                    disabled={!isModelLoaded || isClassifying || isDisabled}
                    className="h-9 rounded bg-cyan-700 px-4 text-sm font-medium text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isClassifying
                        ? labels.recognizing
                        : labels.recognizeDrawings}
                </button>
                <button
                    type="button"
                    onClick={() =>
                        onCheck(
                            boxes
                                .map((box) => box.selected?.className)
                                .join(""),
                        )
                    }
                    disabled={!allCharactersSelected || isDisabled}
                    className="h-9 rounded bg-neutral-100 px-4 text-sm font-medium text-neutral-950 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {labels.checkDrawingAnswer}
                </button>
                <button
                    type="button"
                    onClick={onGiveUp}
                    disabled={isDisabled}
                    className="h-9 rounded border border-neutral-600 bg-neutral-800 px-4 text-sm font-medium text-neutral-100 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {labels.giveup}
                </button>
            </div>
        </section>
    );
}
