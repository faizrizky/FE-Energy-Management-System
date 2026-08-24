import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

export function BreadcrumbNav({ items }: { items: string[] }) {
  return (
    <div className="flex h-10 items-center gap-1 rounded-lg">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <Fragment key={item}>
            {index > 0 && <ChevronRight className="size-4 text-slate-500" />}
            <span className={isLast ? "text-xs font-semibold text-emerald-500" : "text-xs text-slate-500"}>
              {item}
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}
