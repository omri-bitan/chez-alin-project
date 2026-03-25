import { Separator } from "@/components/ui/separator";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
}

export function SectionHeading({ title, subtitle }: SectionHeadingProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center mb-12">
      <div className="flex items-center gap-4 w-full max-w-md">
        <Separator className="flex-1 bg-amber-500/30" />
        <h2 className="text-3xl font-semibold tracking-tight text-amber-50 whitespace-nowrap">
          {title}
        </h2>
        <Separator className="flex-1 bg-amber-500/30" />
      </div>
      {subtitle && (
        <p className="text-sm text-zinc-400 max-w-lg">{subtitle}</p>
      )}
    </div>
  );
}
