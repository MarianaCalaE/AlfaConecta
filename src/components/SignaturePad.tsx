import React, { useEffect, useRef, useState } from 'react';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  existingSignature?: string;
  onSave: (dataUrl: string) => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  label,
  existingSignature,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [existingSignature]);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasStrokes(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const clearPad = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  };

  const savePad = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) return;
    onSave(canvas.toDataURL('image/png'));
  };

  if (existingSignature) {
    return (
      <div className="rounded-xl border border-[#D6E2DB] bg-[#F4F7F5] p-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-bold text-[#111827]">{label}</span>
          <span className="font-bold text-[#116D36]">Firmado</span>
        </div>
        <div className="mt-2 overflow-hidden rounded-lg border border-[#D6E2DB] bg-white p-2">
          <img
            src={existingSignature}
            alt={`Firma digital de ${label}`}
            className="h-20 w-full object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#D6E2DB] bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-[#111827]">{label}</span>
        <span className="text-xs text-slate-500">Firma aquí</span>
      </div>
      <canvas
        ref={canvasRef}
        width={420}
        height={130}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full touch-none rounded-lg border border-dashed border-slate-300 bg-white cursor-crosshair"
      />
      <div className="mt-2.5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={clearPad}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-[#111827] hover:bg-[#F4F7F5]"
        >
          <Eraser className="h-4 w-4" strokeWidth={2.2} />
          <span>Limpiar</span>
        </button>
        <button
          type="button"
          disabled={!hasStrokes}
          onClick={savePad}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#116D36] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#0B4D25] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check className="h-4 w-4" strokeWidth={2.4} />
          <span>Confirmar firma</span>
        </button>
      </div>
    </div>
  );
};
