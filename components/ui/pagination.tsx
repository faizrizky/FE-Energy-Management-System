'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  rowsPerPage: number;
  onRowsPerPageChange: (rows: number) => void;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  rowsPerPage,
  onRowsPerPageChange,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.length <= 5 ? pages : [1, 2, 3, '...', totalPages];
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [showMobileDock, setShowMobileDock] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowMobileDock(entry.isIntersecting),
      {
        rootMargin: '0px 0px 300px 0px',
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* desktop */}
      <div className="hidden w-full items-center justify-between md:flex md:h-9 md:px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Rows per page</span>
          <select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            className="h-8 w-[60px] rounded-md border border-slate-400 bg-white px-2 text-xs text-emerald-500"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="flex h-full items-center gap-2">
          <button
            disabled={!canPrev}
            onClick={() => onPageChange(page - 1)}
            className={cn(
              'rounded-lg px-4 py-2.5 text-sm font-medium',
              canPrev
                ? 'border border-slate-400 bg-white text-slate-950 hover:bg-slate-50'
                : 'cursor-not-allowed border border-transparent bg-neutral-200 text-neutral-400'
            )}
          >
            Prev
          </button>

          <div className="flex items-center gap-1">
            {visible.map((p, i) =>
              p === '...' ? (
                <span
                  key={`ellipsis-${i}`}
                  className="flex size-8 items-center justify-center text-slate-400"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p as number)}
                  className={cn(
                    'flex size-8 items-center justify-center rounded-md text-sm',
                    p === page
                      ? 'bg-emerald-500 text-white'
                      : 'bg-emerald-100 text-emerald-500'
                  )}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            disabled={!canNext}
            onClick={() => onPageChange(page + 1)}
            className={cn(
              'rounded-lg px-4 py-2.5 text-sm font-medium',
              canNext
                ? 'border border-slate-400 bg-white text-slate-950 hover:bg-slate-50'
                : 'cursor-not-allowed border border-transparent bg-neutral-200 text-neutral-400'
            )}
          >
            Next
          </button>
        </div>
      </div>

      <div ref={sentinelRef} className="h-px w-full md:hidden" aria-hidden />

      {/* mobile */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden">
        <AnimatePresence>
          {showMobileDock && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="pointer-events-auto flex justify-center bg-gradient-to-b from-white/0 via-white/70 to-white/95 px-4 pb-1 pt-6 "
            >
              <div className="flex w-full max-w-[340px] items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white/95 px-3 py-2 shadow-[0px_4px_12px_rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-1.5">
                  <select
                    value={rowsPerPage}
                    onChange={(e) =>
                      onRowsPerPageChange(Number(e.target.value))
                    }
                    className="h-7 rounded-md border border-slate-300 bg-white px-1.5 text-xs font-medium text-emerald-600"
                  >
                    {[10, 20, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span className="whitespace-nowrap text-xs text-slate-500">
                    / page
                  </span>
                </div>

                <span className="whitespace-nowrap text-sm text-slate-950">
                  Page {page}/{totalPages}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    aria-label="Previous page"
                    disabled={!canPrev}
                    onClick={() => onPageChange(page - 1)}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full border',
                      canPrev
                        ? 'border-slate-300 bg-white text-slate-950'
                        : 'cursor-not-allowed border-transparent bg-neutral-200 text-neutral-400'
                    )}
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    aria-label="Next page"
                    disabled={!canNext}
                    onClick={() => onPageChange(page + 1)}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full border',
                      canNext
                        ? 'border-slate-300 bg-white text-slate-950'
                        : 'cursor-not-allowed border-transparent bg-neutral-200 text-neutral-400'
                    )}
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
