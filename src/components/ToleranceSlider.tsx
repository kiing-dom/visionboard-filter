"use client";

interface ToleranceSliderProps {
  value: number;
  onChange: (value: number) => void;
  hidden: number;
}

export function ToleranceSlider({
  value,
  onChange,
  hidden,
}: ToleranceSliderProps) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <span className="opacity-60">Minimum match</span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(value * 100)}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        className="h-1 w-40 cursor-pointer accent-blue-500"
      />
      <span className="w-10 font-mono tabular-nums">
        {Math.round(value * 100)}%
      </span>
      {hidden > 0 && (
        <span className="opacity-50">
          {hidden} below threshold
        </span>
      )}
    </label>
  );
}
