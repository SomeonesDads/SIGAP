"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { PLACES, SEVERITY_META, type Hotspot, type Place } from "@/lib/monitoring";
import { searchGeocodePlaces } from "@/lib/api";
import { cn } from "@/lib/utils";

type Result =
  | { kind: "hotspot"; key: string; hotspot: Hotspot }
  | { kind: "place"; key: string; place: Place; badge?: string };

interface LocationSearchProps {
  hotspots: Hotspot[];
  onSelectHotspot: (hotspot: Hotspot) => void;
  onSelectPlace: (place: Place) => void;
  size?: "desktop" | "mobile";
  className?: string;
}

const MAX_RESULTS = 8;

/** Figma "Cari lokasi..." search field, searching live OSM Nominatim places and active hotspot clusters. */
export function LocationSearch({
  hotspots,
  onSelectHotspot,
  onSelectPlace,
  size = "desktop",
  className,
}: LocationSearchProps) {
  const isDesktop = size === "desktop";
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [livePlaces, setLivePlaces] = useState<Place[]>([]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setLivePlaces([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const found = await searchGeocodePlaces(q, 5);
      if (!cancelled) {
        setLivePlaces(
          found.map((f) => ({
            name: f.name,
            lat: f.lat,
            lon: f.lon,
            zoom: f.zoom,
          }))
        );
      }
    }, 260);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const hotspotHits: Result[] = hotspots
      .filter(
        (h) =>
          h.id.toLowerCase().includes(q) ||
          h.location.toLowerCase().includes(q) ||
          (h.district && h.district.toLowerCase().includes(q))
      )
      .map((h) => ({ kind: "hotspot", key: `hs-${h.id}`, hotspot: h }));

    const presetHits: Result[] = PLACES.filter((p) =>
      p.name.toLowerCase().includes(q)
    ).map((p) => ({
      kind: "place",
      key: `preset-${p.name}`,
      place: p,
    }));

    const seenNames = new Set(presetHits.map((p) => p.place.name.toLowerCase()));
    const osmHits: Result[] = livePlaces
      .filter((p) => !seenNames.has(p.name.toLowerCase()))
      .map((p, idx) => ({
        kind: "place",
        key: `osm-${idx}-${p.lat}-${p.lon}`,
        place: p,
        badge: "OSM Live",
      }));

    return [...hotspotHits, ...presetHits, ...osmHits].slice(0, MAX_RESULTS);
  }, [hotspots, query, livePlaces]);

  const choose = (result: Result) => {
    if (result.kind === "hotspot") {
      onSelectHotspot(result.hotspot);
      setQuery(result.hotspot.id);
    } else {
      onSelectPlace(result.place);
      setQuery(result.place.name);
    }
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && query.trim().length > 0;

  return (
    <div className={cn("relative", className)}>
      <label
        className={cn(
          "flex w-full cursor-text items-center rounded-[10px] border border-slate-400 bg-slate-50 pl-4 pr-4 transition-shadow focus-within:border-sigap-cobalt focus-within:ring-2 focus-within:ring-sigap-cobalt/30",
          isDesktop ? "h-[58px] gap-6" : "h-[34px] gap-6"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src="/figma/search.svg" className="block size-[21px] shrink-0 max-w-none" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="Cari lokasi, desa, kabupaten, atau ID klaster..."
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className={cn(
            "w-full min-w-0 bg-transparent font-mono font-semibold leading-none text-slate-800 outline-none placeholder:text-slate-600 [&::-webkit-search-cancel-button]:cursor-pointer",
            isDesktop ? "text-[24px] tracking-[-0.48px]" : "text-[16px] tracking-[-0.32px]"
          )}
        />
      </label>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-[1100] overflow-hidden rounded-[10px] border border-slate-400 bg-slate-50 py-1 shadow-[0_4px_12px_rgba(0,0,0,0.18)]"
        >
          {results.length === 0 && (
            <li className="px-4 py-3 font-mono text-sm text-slate-600">
              Mencari lokasi di Indonesia...
            </li>
          )}
          {results.map((r, i) => (
            <li key={r.key} role="option" aria-selected={i === active}>
              <button
                type="button"
                // Keep focus on the input so onBlur does not close the list before click
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(r)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left",
                  i === active ? "bg-slate-200" : "hover:bg-slate-100"
                )}
              >
                {r.kind === "hotspot" ? (
                  <span
                    className="size-3 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: SEVERITY_META[r.hotspot.severity].color }}
                  />
                ) : (
                  <MapPin className="size-4 shrink-0 text-slate-600" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-mono text-sm font-semibold text-slate-800">
                    <span className="truncate">
                      {r.kind === "hotspot" ? r.hotspot.id : r.place.name}
                    </span>
                    {r.kind === "place" && r.badge && (
                      <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
                        {r.badge}
                      </span>
                    )}
                  </span>
                  {r.kind === "hotspot" && (
                    <span className="block truncate text-xs text-slate-600">{r.hotspot.location}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
