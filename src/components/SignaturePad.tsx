"use client";

import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { Eraser } from "lucide-react";

export interface SignaturePadHandle {
  getDataUrl: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
}

export const SignaturePad = forwardRef<SignaturePadHandle, { height?: number }>(
  function SignaturePad({ height = 160 }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const hasDrawn = useRef(false);
    const [empty, setEmpty] = useState(true);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Resolução real maior que o CSS pra assinatura não ficar borrada
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(ratio, ratio);
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#17131c";
      }
    }, []);

    useImperativeHandle(ref, () => ({
      getDataUrl: () => {
        if (!hasDrawn.current || !canvasRef.current) return null;
        return canvasRef.current.toDataURL("image/png");
      },
      clear: () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasDrawn.current = false;
        setEmpty(true);
      },
      isEmpty: () => !hasDrawn.current,
    }));

    function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
      drawing.current = true;
      const ctx = canvasRef.current?.getContext("2d");
      const { x, y } = getPos(e);
      ctx?.beginPath();
      ctx?.moveTo(x, y);
    }

    function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
      if (!drawing.current) return;
      const ctx = canvasRef.current?.getContext("2d");
      const { x, y } = getPos(e);
      ctx?.lineTo(x, y);
      ctx?.stroke();
      hasDrawn.current = true;
      setEmpty(false);
    }

    function handlePointerUp() {
      drawing.current = false;
    }

    function handleClear() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasDrawn.current = false;
      setEmpty(true);
    }

    return (
      <div>
        <canvas
          ref={canvasRef}
          style={{ height, touchAction: "none" }}
          className="w-full cursor-crosshair rounded-lg border border-border bg-white"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-xs text-muted">Assine com o dedo ou o mouse na área acima.</p>
          {!empty && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 text-xs font-medium text-muted hover:text-danger"
            >
              <Eraser size={12} />
              Limpar
            </button>
          )}
        </div>
      </div>
    );
  }
);
