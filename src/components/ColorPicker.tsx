"use client";

import { useState } from "react";
import { hexToRgb, rgbToHex } from "@/lib/colors";
import type { RGBColor } from "@/types/image";

interface ColorPickerProps {
  colors: RGBColor[];
  onChange: (colors: RGBColor[]) => void;
}

export function ColorPicker({ colors, onChange }: ColorPickerProps) {
  const [draft, setDraft] = useState("");
  const [invalid, setInvalid] = useState(false);

  function add() {
    const parsed = hexToRgb(draft);
    if (!parsed) {
      setInvalid(draft.trim().length > 0);
      return;
    }
    onChange([...colors, parsed]);
    setDraft("");
    setInvalid(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {colors.map((color, index) => (
          <span
            key={`${rgbToHex(color)}-${index}`}
            className="flex items-center gap-2 rounded-md border border-black/15 py-1 pl-1 pr-2 text-sm"
          >
            <span
              className="h-5 w-5 rounded border border-black/10"
              style={{ backgroundColor: rgbToHex(color) }}
            />
            <code className="text-xs">{rgbToHex(color)}</code>
            <button
              type="button"
              aria-label={`Remove ${rgbToHex(color)}`}
              onClick={() => onChange(colors.filter((_, i) => i !== index))}
              className="opacity-50 hover:opacity-100"
            >
              ×
            </button>
          </span>
        ))}

        <input
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setInvalid(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder="#C9B79C"
          aria-label="Add a target colour"
          aria-invalid={invalid}
          className={`w-28 rounded-md border px-2 py-1.5 font-mono text-sm outline-none focus:border-blue-500 ${
            invalid ? "border-red-500" : "border-black/15"
          }`}
        />
      </div>

      {invalid && (
        <p className="text-xs text-red-600">
          Enter a hex colour, for example #C9B79C.
        </p>
      )}
    </div>
  );
}
