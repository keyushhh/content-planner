"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

/** Apple's reposition spring: critically damped, so it settles without overshoot. */
const SPRING = { type: "spring" as const, bounce: 0, duration: 0.4 }

/** Dismiss if dragged past this share of the sheet, or thrown faster than this. */
const DISMISS_RATIO = 0.35
const DISMISS_VELOCITY = 400

type Side = "top" | "right" | "bottom" | "left"

/** Which axis the sheet travels on, and which direction closes it. */
const AXIS: Record<Side, { axis: "x" | "y"; sign: 1 | -1 }> = {
  right: { axis: "x", sign: 1 },
  left: { axis: "x", sign: -1 },
  bottom: { axis: "y", sign: 1 },
  top: { axis: "y", sign: -1 },
}

/**
 * base-ui owns mounting, so the exit has to tell it when the animation is done.
 * `open` comes from this provider rather than base-ui's internal context, which
 * is not part of its public API.
 */
type SheetState = {
  open: boolean
  actions: React.RefObject<SheetPrimitive.Root.Actions | null>
}
const SheetStateContext = React.createContext<SheetState | null>(null)

function Sheet({ open = false, ...props }: SheetPrimitive.Root.Props) {
  const actions = React.useRef<SheetPrimitive.Root.Actions | null>(null)
  const value = React.useMemo(() => ({ open, actions }), [open])
  return (
    <SheetStateContext.Provider value={value}>
      <SheetPrimitive.Root
        data-slot="sheet"
        open={open}
        actionsRef={actions}
        {...props}
      />
    </SheetStateContext.Provider>
  )
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs",
        className
      )}
      {...props}
    />
  )
}

/** Static per-side geometry. Travel is motion's job now, not the class list's. */
const SIDE_CLASS: Record<Side, string> = {
  right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
  left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
  bottom: "inset-x-0 bottom-0 h-auto border-t",
  top: "inset-x-0 top-0 h-auto border-b",
}

function SheetContent({
  className,
  overlayClassName,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: Side
  showCloseButton?: boolean
  /** The scrim, for callers that want a heavier one than the default. */
  overlayClassName?: string
}) {
  const state = React.useContext(SheetStateContext)
  const reduced = useReducedMotion()
  const { axis, sign } = AXIS[side]

  const hidden = reduced
    ? { opacity: 0 }
    : { opacity: 0, [axis]: `${sign * 100}%` }
  const shown = reduced ? { opacity: 1 } : { opacity: 1, [axis]: 0 }

  return (
    <SheetPortal keepMounted>
      <AnimatePresence
        // base-ui restores focus and unlocks scrolling here, once the sheet has
        // actually left the screen.
        onExitComplete={() => state?.actions.current?.unmount()}
      >
        {state?.open && (
          <SheetOverlay
            key="sheet-overlay"
            className={overlayClassName}
            render={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            }
          />
        )}

        {state?.open && (
          <SheetPrimitive.Popup
            key="sheet-popup"
            data-slot="sheet-content"
            data-side={side}
            className={cn(
              "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg",
              SIDE_CLASS[side],
              className
            )}
            render={
              <motion.div
                initial={hidden}
                animate={shown}
                exit={hidden}
                transition={SPRING}
                // Dragging is only offered when motion is welcome.
                drag={reduced ? false : axis}
                // Zero on the closing side is unconstrained, so it tracks the
                // pointer 1:1; the other side rubber-bands instead of stopping.
                dragConstraints={
                  axis === "x"
                    ? sign === 1
                      ? { left: 0 }
                      : { right: 0 }
                    : sign === 1
                      ? { top: 0 }
                      : { bottom: 0 }
                }
                dragElastic={0.55}
                dragMomentum={false}
                onDragEnd={(event, info) => {
                  // Measured off the sheet itself: the event target is whatever
                  // child was under the pointer.
                  const el = (
                    event.target as HTMLElement | null
                  )?.closest?.('[data-slot="sheet-content"]') as HTMLElement | null
                  const size =
                    axis === "x"
                      ? (el?.offsetWidth ?? window.innerWidth)
                      : (el?.offsetHeight ?? window.innerHeight)
                  const travelled = info.offset[axis] * sign
                  const velocity = info.velocity[axis] * sign
                  // Where the throw would come to rest, not where the finger let
                  // go, so a short fast flick still dismisses.
                  const projected = travelled + (velocity / 1000) * 0.998 / (1 - 0.998)
                  if (
                    projected > size * DISMISS_RATIO ||
                    velocity > DISMISS_VELOCITY
                  ) {
                    state?.actions.current?.close()
                  }
                  // Not dismissed: motion springs back to `animate` on its own.
                }}
              />
            }
            {...props}
          >
            {children}
            {showCloseButton && (
              <SheetPrimitive.Close
                data-slot="sheet-close"
                render={
                  <Button
                    variant="ghost"
                    className="absolute top-3 right-3"
                    size="icon-sm"
                  />
                }
              >
                <XIcon />
                <span className="sr-only">Close</span>
              </SheetPrimitive.Close>
            )}
          </SheetPrimitive.Popup>
        )}
      </AnimatePresence>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetOverlay,
  SheetPortal,
}
