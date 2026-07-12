import { useState, useCallback, useRef, useEffect } from "react";
import * as ort from "onnxruntime-web";

export interface ClassifierResult {
    classIndex: number;
    className: string;
    confidence: number;
}

interface UseCharClassifierOptions {
    modelUrl?: string;
    labelsUrl?: string;
    canvasSize?: number;
    modelInputSize?: number;
}

export function useCharClassifier(options: UseCharClassifierOptions = {}) {
    const {
        modelUrl = "/models/char_classifier.onnx",
        labelsUrl = "/labels.txt",
        canvasSize = 256,
        modelInputSize = 64,
    } = options;

    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const sessionRef = useRef<ort.InferenceSession | null>(null);
    const labelsRef = useRef<string[]>([]);

    // Load the model and labels once on mount
    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Load model
                sessionRef.current = await ort.InferenceSession.create(modelUrl, {
                    executionProviders: ["wasm"],
                });

                // Load labels (chars format: each character is a class label)
                const labelsRes = await fetch(labelsUrl);
                const labelsText = await labelsRes.text();
                labelsRef.current = [...labelsText.trim()];

                setIsModelLoaded(true);
            } catch (err) {
                console.error("Failed to load:", err);
                setError(err instanceof Error ? err.message : "Failed to load model");
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, [modelUrl, labelsUrl]);

    /**
     * Run inference on a canvas element
     * Returns the highest-confidence character candidates in ranked order.
     */
    const classify = useCallback(
        async (canvas: HTMLCanvasElement): Promise<ClassifierResult[] | null> => {
            if (!sessionRef.current) {
                console.error("Model not loaded");
                return null;
            }

            try {
                // Preprocess: resize canvas to model input size
                const inputCanvas = document.createElement("canvas");
                inputCanvas.width = modelInputSize;
                inputCanvas.height = modelInputSize;
                const ctx = inputCanvas.getContext("2d")!;

                // Draw the input canvas scaled to fit
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, modelInputSize, modelInputSize);
                ctx.drawImage(canvas, 0, 0, modelInputSize, modelInputSize);

                // Get image data
                const imageData = ctx.getImageData(0, 0, modelInputSize, modelInputSize);
                const { data } = imageData;

                // Convert to float32 array - model does its own normalization
                // The preprocessing layer: converts to grayscale (mean of channels),
                // normalizes by image's own max, then resizes
                // Feed raw pixel values (0-255) as float32
                const inputData = new Float32Array(modelInputSize * modelInputSize);

                for (let i = 0; i < modelInputSize * modelInputSize; i++) {
                    // RGBA to grayscale: average RGB channels, ignore alpha
                    const r = data[i * 4];
                    const g = data[i * 4 + 1];
                    const b = data[i * 4 + 2];
                    inputData[i] = (r + g + b) / 3;
                }

                // Create tensor - shape [1, 1, H, W]
                const inputTensor = new ort.Tensor("float32", inputData, [
                    1,
                    1,
                    modelInputSize,
                    modelInputSize,
                ]);

                // Run inference
                const results = await sessionRef.current.run({ image: inputTensor });

                // Get output tensor
                const outputTensor = results[Object.keys(results)[0]] as ort.Tensor;
                const outputData = outputTensor.data as Float32Array;

                const maxLogit = Math.max(...outputData);
                const expSum = outputData.reduce(
                    (sum, value) => sum + Math.exp(value - maxLogit),
                    0,
                );

                return Array.from(outputData)
                    .map((value, classIndex) => ({
                        classIndex,
                        className: labelsRef.current[classIndex] ?? "?",
                        confidence: Math.exp(value - maxLogit) / expSum,
                    }))
                    .sort((a, b) => b.confidence - a.confidence)
                    .slice(0, 5);
            } catch (err) {
                console.error("Classification failed:", err);
                return null;
            }
        },
        [modelInputSize],
    );

    return {
        classify,
        isModelLoaded,
        isLoading,
        error,
        canvasSize,
        modelInputSize,
    };
}
