"use client";

import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  active: string | null;
  busy?: boolean;
}

const EXAMPLES = ["quiet luxury", "coastal european town", "minimalist architecture"];

export function SearchBar({ onSearch, onClear, active, busy }: SearchBarProps) {
  const [draft, setDraft] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (draft.trim() === "") {
      onClear();
      return;
    }
    onSearch(draft);
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={submit} className="flex w-full items-center gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="describe what you're looking for"
          aria-label="Search images by description"
          className="min-w-0 flex-1 rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#1c1c1c]"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 cursor-pointer rounded-md border border-black/15 px-3 py-2 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50"
        >
          search
        </button>
        {active && (
          <button
            type="button"
            onClick={() => {
              setDraft("");
              onClear();
            }}
            className="shrink-0 cursor-pointer whitespace-nowrap px-1 text-sm underline underline-offset-4 opacity-70 hover:opacity-100"
          >
            clear
          </button>
        )}
      </form>

      {!active && (
        <div className="flex flex-wrap items-center gap-2 text-xs opacity-50">
          <span>try</span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setDraft(example);
                onSearch(example);
              }}
              className="cursor-pointer rounded border border-black/15 px-1.5 py-0.5 hover:bg-black/5"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
