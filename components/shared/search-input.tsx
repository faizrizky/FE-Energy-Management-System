'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  className,
}: SearchInputProps) {
  return (
    <div className={className}>
      <div className="relative flex h-11 w-full items-center gap-1 rounded-md border border-slate-400 bg-white px-3 shadow-sm md:h-8 md:w-[250px]">
        <Search className="size-4 shrink-0 text-slate-500" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-500"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
          >
            <X className="size-4 text-slate-500" />
          </button>
        )}
      </div>
    </div>
  );
}
