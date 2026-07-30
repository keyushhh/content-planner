import {
  Link2,
  Settings,
  PenLine,
  Copy,
  Download,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CampaignContextMenu({
  onOpen,
}: {
  onOpen: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-(--ink)/[0.06] hover:text-foreground/90 active:scale-95"
          >
            <MoreHorizontal className="size-4" />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
          <Link2 className="mr-2 size-4 opacity-70" />
          <span>Copy link</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
          <Settings className="mr-2 size-4 opacity-70" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          <PenLine className="mr-2 size-4 opacity-70" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
          <Copy className="mr-2 size-4 opacity-70" />
          <span>Duplicate</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
          <Download className="mr-2 size-4 opacity-70" />
          <span>Export (JSON)</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => e.stopPropagation()}
          className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
        >
          <Trash2 className="mr-2 size-4 opacity-70" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
