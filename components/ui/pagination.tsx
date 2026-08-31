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

  return (
    <div className="flex w-full flex-col-reverse gap-3 md:h-9 md:flex-row md:items-center md:justify-between md:gap-0 md:px-2">
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

      <div className="flex w-full items-center gap-2 md:h-full md:w-auto">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex-1 rounded-lg bg-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-500 disabled:opacity-60 md:flex-none"
        >
          Prev
        </button>

        <div className="hidden items-center gap-1 md:flex">
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
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex-1 rounded-lg border border-slate-400 px-4 py-2.5 text-sm font-medium text-slate-950 disabled:opacity-60 md:flex-none"
        >
          Next
        </button>
      </div>
    </div>
  );
}
