"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/format";
import { useT } from "@/i18n/client";

interface Suggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

interface ParsedAddress {
  line1: string;
  city: string;
  region: string;
  zip: string;
  country: string;
}

const input = "h-12 w-full rounded-xl border border-black/15 bg-white px-4 text-sm outline-none transition-colors placeholder:text-black/35 focus:border-black";

/** Campo de dirección (línea 1) con sugerencias de Google Places. Si no hay clave configurada se comporta como un campo normal. */
export function AddressAutocomplete({
  label,
  value,
  onChange,
  onSelectAddress,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSelectAddress: (address: ParsedAddress) => void;
}) {
  const { t, locale } = useT();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const sessionToken = useRef<string>(crypto.randomUUID());
  const box = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNext = useRef(false);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleChange(v: string) {
    onChange(v);
    setHighlight(-1);
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    if (v.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ input: v, sessionToken: sessionToken.current, lang: locale }),
        });
        const data = (await res.json().catch(() => null)) as { suggestions?: Suggestion[] } | null;
        setSuggestions(data?.suggestions ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  async function pick(s: Suggestion) {
    skipNext.current = true;
    onChange(`${s.mainText}, ${s.secondaryText}`);
    setSuggestions([]);
    setOpen(false);
    setLoading(true);
    try {
      const res = await fetch("/api/places/details", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ placeId: s.placeId, sessionToken: sessionToken.current, lang: locale }),
      });
      const data = (await res.json().catch(() => null)) as { address?: ParsedAddress } | null;
      if (data?.address) {
        skipNext.current = true;
        onChange(data.address.line1);
        onSelectAddress(data.address);
      }
    } finally {
      setLoading(false);
      sessionToken.current = crypto.randomUUID();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && highlight >= 0) {
      e.preventDefault();
      void pick(suggestions[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={box} className="relative sm:col-span-2">
      <label>
        <span className="mb-1.5 block text-xs font-medium text-black/60">{label}</span>
        <input
          name="line1"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          type="text"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="address-suggestions"
          aria-autocomplete="list"
          placeholder={t.checkout.addressSearchPlaceholder}
          required
          className={input}
        />
      </label>

      {open && (loading || suggestions.length > 0) && (
        <ul id="address-suggestions" className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-black/10 bg-white py-1 shadow-lg">
          {loading && suggestions.length === 0 && <li className="px-4 py-2.5 text-sm text-black/40">{t.checkout.addressSearching}</li>}
          {suggestions.map((s, i) => (
            <li key={s.placeId}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void pick(s)}
                onMouseEnter={() => setHighlight(i)}
                className={cn("flex w-full items-start gap-2.5 px-4 py-2.5 text-left text-sm transition-colors", highlight === i ? "bg-black/5" : "hover:bg-black/5")}
              >
                <MapPin size={15} className="mt-0.5 shrink-0 text-black/40" />
                <span>
                  <span className="font-medium">{s.mainText}</span>
                  {s.secondaryText && <span className="text-black/50">, {s.secondaryText}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
