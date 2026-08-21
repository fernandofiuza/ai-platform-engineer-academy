"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { searchStudyHubAction } from "@/modules/study-hub/actions";

type SearchResult = { id: string; title: string; contextLabel: string; href: string };

export function StudyHubSearch() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<{
    nativeLessons: SearchResult[];
    externalLessons: SearchResult[];
  } | null>(null);

  const showDropdown = query.trim().length >= 2;

  React.useEffect(() => {
    if (!showDropdown) return;
    const handle = setTimeout(async () => {
      const result = await searchStudyHubAction(query);
      setResults(result.results);
    }, 300);
    return () => clearTimeout(handle);
  }, [query, showDropdown]);

  const hasResults =
    results && (results.nativeLessons.length > 0 || results.externalLessons.length > 0);

  return (
    <div className="relative">
      <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar curso, módulo ou aula..."
        className="pl-8"
      />
      {showDropdown && results ? (
        <div className="absolute z-10 mt-1 w-full rounded-lg border bg-popover shadow-md">
          {!hasResults ? (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">Nada encontrado.</p>
          ) : (
            <div className="max-h-80 divide-y overflow-y-auto">
              {[...results.nativeLessons, ...results.externalLessons].map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setQuery("")}
                  className="block px-3 py-2.5 hover:bg-muted/50"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.contextLabel}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
