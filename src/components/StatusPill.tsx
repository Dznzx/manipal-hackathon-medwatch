import { Forecast } from "@/lib/types";
import { STATUS_COLORS, STATUS_LABEL } from "@/lib/ui";

export default function StatusPill({ status }: { status: Forecast["status"] }) {
  const c = STATUS_COLORS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}
