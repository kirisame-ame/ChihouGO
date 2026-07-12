import { useRef, useState, useCallback } from "react";
import { DrawingCanvas, type DrawingCanvasRef } from "./DrawingCanvas";
import {
    useCharClassifier,
    type ClassifierResult,
} from "../hooks/useCharClassifier";

export function CanvasTest() {
    const canvasRef = useRef<DrawingCanvasRef>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [results, setResults] = useState<ClassifierResult[]>([]);
    const [selectedResult, setSelectedResult] =
        useState<ClassifierResult | null>(null);
    const [isClassifying, setIsClassifying] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const { classify, isModelLoaded, isLoading, error, canvasSize } =
        useCharClassifier({
            canvasSize: 256,
            modelInputSize: 64,
        });

    const handleClassify = async () => {
        const canvas = canvasRef.current?.getCanvas();
        if (!canvas || !isModelLoaded) return;

        setIsClassifying(true);
        const classification = await classify(canvas);
        setResults(classification ?? []);
        setSelectedResult(null);
        setIsClassifying(false);
    };

    const handleClear = () => {
        canvasRef.current?.clear();
        setResults([]);
        setSelectedResult(null);
        setPreviewImage(null);
    };

    const handleFileUpload = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                setPreviewImage(dataUrl);

                // Load image and draw to canvas
                const img = new Image();
                img.onload = () => {
                    const canvas = canvasRef.current?.getCanvas();
                    if (!canvas) return;
                    const ctx = canvas.getContext("2d")!;
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    setResults([]);
                    setSelectedResult(null);
                };
                img.src = dataUrl;
            };
            reader.readAsDataURL(file);

            // Reset input so same file can be selected again
            e.target.value = "";
        },
        [],
    );

    return (
        <div className="max-w-2xl mx-auto p-5 border border-neutral-700 rounded-xl bg-neutral-900 my-10">
            <h1 className="text-3xl mb-4">Character Classifier Test</h1>

            {isLoading && <p className="text-yellow-400">Loading model...</p>}
            {error && <p className="text-red-400">Error: {error}</p>}
            {isModelLoaded && !error && (
                <p className="text-green-400">Model loaded!</p>
            )}

            <div className="flex flex-col items-center gap-4 mt-4">
                <DrawingCanvas
                    ref={canvasRef}
                    width={canvasSize}
                    height={canvasSize}
                    lineWidth={6}
                    lineColor="white"
                    backgroundColor="black"
                />

                <div className="flex gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <button
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Upload Image
                    </button>
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        onClick={handleClassify}
                        disabled={!isModelLoaded || isClassifying}
                    >
                        {isClassifying ? "Classifying..." : "Classify"}
                    </button>
                    <button
                        className="px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600"
                        onClick={handleClear}
                    >
                        Clear
                    </button>
                </div>

                {previewImage && (
                    <p className="text-neutral-400 text-sm">
                        Image loaded from file
                    </p>
                )}

                {results.length > 0 && (
                    <div className="mt-4 p-4 bg-neutral-800 rounded-lg">
                        <p className="text-sm font-medium text-neutral-300">
                            Choose a character
                        </p>
                        <div className="mt-3 grid grid-cols-5 gap-2">
                            {results.map((result) => {
                                const isSelected =
                                    selectedResult?.classIndex === result.classIndex;

                                return (
                                    <button
                                        key={result.classIndex}
                                        type="button"
                                        aria-pressed={isSelected}
                                        onClick={() => setSelectedResult(result)}
                                        className={`flex min-h-20 flex-col items-center justify-center rounded-lg border px-2 py-2 transition-colors cursor-pointer ${
                                            isSelected
                                                ? "border-cyan-400 bg-cyan-950 text-cyan-200"
                                                : "border-neutral-600 bg-neutral-900 text-neutral-100 hover:border-cyan-500 hover:bg-neutral-700"
                                        }`}
                                    >
                                        <span className="text-3xl leading-none">
                                            {result.className}
                                        </span>
                                        <span className="mt-2 text-xs text-neutral-400">
                                            {(result.confidence * 100).toFixed(1)}%
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        {selectedResult && (
                            <p className="mt-3 text-sm text-cyan-300">
                                Selected: {selectedResult.className}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <p className="text-neutral-400 mt-4 text-sm">
                Draw a character on the canvas or upload an image to test the
                model.
            </p>
        </div>
    );
}
