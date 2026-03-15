import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

const MenubarMenu = MenubarPrimitive.Menu
const MenubarGroup = MenubarPrimitive.Group
const MenubarPortal = MenubarPrimitive.Portal
const MenubarSub = MenubarPrimitive.Sub
const MenubarRadioGroup = MenubarPrimitive.RadioGroup

/* ROOT */

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (

  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-11 items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2 shadow-sm",
      className
    )}
    {...props}
  />

))

Menubar.displayName = "Menubar"

/* TRIGGER */

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (

  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex items-center px-3 py-1.5 text-sm font-medium text-zinc-700 rounded-lg outline-none",
      "hover:bg-zinc-100 focus:bg-zinc-100",
      "data-[state=open]:bg-zinc-100",
      className
    )}
    {...props}
  />

))

MenubarTrigger.displayName = "MenubarTrigger"

/* CONTENT */

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(({ className, align = "start", sideOffset = 8, ...props }, ref) => (

  <MenubarPrimitive.Portal>

    <MenubarPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[220px] overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-lg",
        className
      )}
      {...props}
    />

  </MenubarPrimitive.Portal>

))

MenubarContent.displayName = "MenubarContent"

/* ITEM */

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item>
>(({ className, ...props }, ref) => (

  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      "flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 rounded-lg outline-none",
      "hover:bg-zinc-100 focus:bg-zinc-100",
      "data-[disabled]:opacity-50 data-[disabled]:pointer-events-none",
      className
    )}
    {...props}
  />

))

MenubarItem.displayName = "MenubarItem"

/* SUB TRIGGER */

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger>
>(({ className, children, ...props }, ref) => (

  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex items-center px-3 py-2 text-sm text-zinc-700 rounded-lg outline-none",
      "hover:bg-zinc-100 focus:bg-zinc-100",
      className
    )}
    {...props}
  >

    {children}

    <ChevronRight className="ml-auto h-4 w-4 text-zinc-400" />

  </MenubarPrimitive.SubTrigger>

))

MenubarSubTrigger.displayName = "MenubarSubTrigger"

/* SUB CONTENT */

const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (

  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[200px] rounded-xl border border-zinc-200 bg-white p-1 shadow-lg",
      className
    )}
    {...props}
  />

))

MenubarSubContent.displayName = "MenubarSubContent"

/* CHECKBOX ITEM */

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (

  <MenubarPrimitive.CheckboxItem
    ref={ref}
    checked={checked}
    className={cn(
      "relative flex items-center gap-2 px-8 py-2 text-sm text-zinc-700 rounded-lg outline-none",
      "hover:bg-zinc-100 focus:bg-zinc-100",
      className
    )}
    {...props}
  >

    <span className="absolute left-3">

      <MenubarPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </MenubarPrimitive.ItemIndicator>

    </span>

    {children}

  </MenubarPrimitive.CheckboxItem>

))

MenubarCheckboxItem.displayName = "MenubarCheckboxItem"

/* RADIO ITEM */

const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (

  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex items-center gap-2 px-8 py-2 text-sm text-zinc-700 rounded-lg outline-none",
      "hover:bg-zinc-100 focus:bg-zinc-100",
      className
    )}
    {...props}
  >

    <span className="absolute left-3">

      <MenubarPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </MenubarPrimitive.ItemIndicator>

    </span>

    {children}

  </MenubarPrimitive.RadioItem>

))

MenubarRadioItem.displayName = "MenubarRadioItem"

/* LABEL */

const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label>
>(({ className, ...props }, ref) => (

  <MenubarPrimitive.Label
    ref={ref}
    className={cn(
      "px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide",
      className
    )}
    {...props}
  />

))

MenubarLabel.displayName = "MenubarLabel"

/* SEPARATOR */

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (

  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("my-1 h-px bg-zinc-200", className)}
    {...props}
  />

))

MenubarSeparator.displayName = "MenubarSeparator"

/* SHORTCUT */

const MenubarShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (

  <span
    className={cn(
      "ml-auto text-xs text-zinc-400 tracking-wide",
      className
    )}
    {...props}
  />

)

MenubarShortcut.displayName = "MenubarShortcut"

/* EXPORT */

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioItem,
  MenubarRadioGroup,
  MenubarPortal,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarShortcut
}
