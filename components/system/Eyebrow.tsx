import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
  index?: string;
}

/** Small caps label, often paired with a numeric index ("01 / Vision"). */
export function Eyebrow({ children, className, index }: Props) {
  return (
    <div className={cn("eyebrow flex items-center gap-3", className)}>
      {index && <span className="text-[var(--color-line-2)]">{index}</span>}
      <span>{children}</span>
    </div>
  );
}
