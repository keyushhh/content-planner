import { ImageIcon, MessageSquare, Repeat2, Send, ThumbsUp } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { mediaAssets as staticMediaAssets } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { Session } from "@/lib/types";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function PublicPostCard({
  session,
  authorName,
  className,
}: {
  session: Session;
  authorName?: string;
  className?: string;
}) {
  const name = authorName ?? session.lastEditedBy?.name ?? "Wozku";
  const image = session.visualAssetIds
    .map((id) => staticMediaAssets.find((a) => a.id === id))
    .find((a): a is NonNullable<typeof a> => Boolean(a) && a!.type === "image");
  const tags = session.hashtags.trim();

  return (
    <div
      className={cn(
        "overflow-hidden rounded-(--r-surface) bg-white text-neutral-900 shadow-(--lift-lg)",
        className,
      )}
    >
      <div className="flex items-start gap-2.5 px-4 pb-2.5 pt-4">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-(--r-round) bg-violet-100 text-[13px] font-semibold text-violet-700"
        >
          {initials(name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold">{name}</span>
          <span className="block text-[11.5px] text-neutral-500">
            {session.sentAt ? relativeTime(session.sentAt) : "Just now"}
          </span>
        </span>
      </div>

      <div className="px-4 pb-3.5 text-[13.5px] leading-[1.55] text-neutral-800">
        <p className="whitespace-pre-wrap text-pretty">
          {session.copy.trim() || <span className="italic text-neutral-400">No copy yet.</span>}
        </p>
        {tags && <p className="mt-2 text-blue-700">{tags}</p>}
      </div>

      {image && image.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.url} alt="" className="aspect-video w-full object-cover" />
      ) : (
        image && (
          <div className="flex aspect-video w-full items-center justify-center bg-neutral-100 text-neutral-400">
            <ImageIcon className="size-6" />
          </div>
        )
      )}

      <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-2 text-[12px] font-medium text-neutral-500">
        <span className="flex items-center gap-1.5">
          <ThumbsUp className="size-3.5" />
          Like
        </span>
        <span className="flex items-center gap-1.5">
          <MessageSquare className="size-3.5" />
          Comment
        </span>
        <span className="flex items-center gap-1.5">
          <Repeat2 className="size-3.5" />
          Repost
        </span>
        <span className="flex items-center gap-1.5">
          <Send className="size-3.5" />
          Send
        </span>
      </div>
    </div>
  );
}
