import {
    useRef,
    useEffect,
    useCallback,
    forwardRef,
    useImperativeHandle,
} from "react";

interface DrawingCanvasProps {
    width?: number;
    height?: number;
    lineWidth?: number;
    lineColor?: string;
    backgroundColor?: string;
    onDraw?: () => void;
}

export interface DrawingCanvasRef {
    clear: () => void;
    getCanvas: () => HTMLCanvasElement | null;
}

export const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
    (
        {
            width = 256,
            height = 256,
            lineWidth = 8,
            lineColor = "white",
            backgroundColor = "black",
            onDraw,
        },
        ref,
    ) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const isDrawingRef = useRef(false);
        const lastPosRef = useRef({ x: 0, y: 0 });

        // Expose methods to parent
        useImperativeHandle(ref, () => ({
            clear: () => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext("2d")!;
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, width, height);
            },
            getCanvas: () => canvasRef.current,
        }));

        // Initialize canvas
        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d")!;
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, width, height);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
        }, [width, height, backgroundColor]);

        const getPos = useCallback(
            (e: { clientX: number; clientY: number }): { x: number; y: number } => {
                const canvas = canvasRef.current;
                if (!canvas) return { x: 0, y: 0 };

                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;

                return {
                    x: (e.clientX - rect.left) * scaleX,
                    y: (e.clientY - rect.top) * scaleY,
                };
            },
            [],
        );

        const startDrawing = useCallback(
            (e: React.MouseEvent | React.TouchEvent) => {
                e.preventDefault();
                isDrawingRef.current = true;
                lastPosRef.current = getPos(
                    "touches" in e
                        ? e.touches[0]
                        : (e as unknown as MouseEvent),
                );
            },
            [getPos],
        );

        const draw = useCallback(
            (e: React.MouseEvent | React.TouchEvent) => {
                if (!isDrawingRef.current) return;
                e.preventDefault();

                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext("2d")!;

                const currentPos = getPos(
                    "touches" in e
                        ? e.touches[0]
                        : (e as unknown as MouseEvent),
                );

                ctx.beginPath();
                ctx.strokeStyle = lineColor;
                ctx.lineWidth = lineWidth;
                ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
                ctx.lineTo(currentPos.x, currentPos.y);
                ctx.stroke();

                lastPosRef.current = currentPos;
                onDraw?.();
            },
            [getPos, lineColor, lineWidth, onDraw],
        );

        const stopDrawing = useCallback(() => {
            isDrawingRef.current = false;
        }, []);

        return (
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="border border-neutral-600 rounded-lg touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
        );
    },
);

DrawingCanvas.displayName = "DrawingCanvas";
