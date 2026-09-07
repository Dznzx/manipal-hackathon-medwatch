import { ReactNode } from "react";

export default function Panel({
  title,
  subtitle,
  icon,
  children,
  className = "",
  bodyClassName = "p-3",
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col ${className}`}>
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        {icon}
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <div className={`overflow-y-auto flex-1 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
