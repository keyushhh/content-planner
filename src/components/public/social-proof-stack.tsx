import { UserRound } from "lucide-react";
import { avatarTint, cn } from "@/lib/utils";

interface ProofPerson {
  id: string;
  name: string;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function SocialProofStack({
  people,
  caption,
  emptyCaption,
  max = 8,
}: {
  people: ProofPerson[];
  caption: string;
  emptyCaption: string;
  max?: number;
}) {
  if (people.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-(--r-float) bg-(--ink)/[0.03] px-4 py-3 inset-ring-1 inset-ring-(--ink)/[0.06]">
        <span className="flex -space-x-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className="flex size-8 items-center justify-center rounded-(--r-round) bg-(--ink)/[0.05] text-muted-foreground/30 ring-2 ring-(--surface-canvas)"
            >
              <UserRound className="size-3.5" />
            </span>
          ))}
        </span>
        <p className="text-[12.5px] text-muted-foreground text-pretty">{emptyCaption}</p>
      </div>
    );
  }

  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;

  return (
    <div className="flex items-center gap-3">
      <span className="flex -space-x-2.5">
        {shown.map((person) => (
          <span
            key={person.id}
            title={person.name}
            className={cn(
              "flex size-8 items-center justify-center rounded-(--r-round) text-[11px] font-semibold ring-2 ring-(--surface-canvas)",
              avatarTint(person.name),
            )}
          >
            {initials(person.name)}
          </span>
        ))}
        {overflow > 0 && (
          <span className="flex size-8 items-center justify-center rounded-(--r-round) bg-(--ink)/[0.08] text-[10.5px] font-semibold text-muted-foreground ring-2 ring-(--surface-canvas)">
            +{overflow}
          </span>
        )}
      </span>
      <p className="text-[12.5px] text-muted-foreground text-pretty">{caption}</p>
    </div>
  );
}
