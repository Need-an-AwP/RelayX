import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const roundButtonVariants = cva(
  "inline-flex items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-neutral-500 text-neutral-foreground hover:bg-neutral-400 hover:scale-110",
        destructive: "bg-[#DA373C] text-destructive-foreground hover:bg-destructive hover:scale-110",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110",
      },
      size: {
        default: "h-14 w-14",
        sm: "h-12 w-12",
        lg: "h-20 w-20",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface RoundButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof roundButtonVariants> {
  asChild?: boolean
}

const RoundButton = React.forwardRef<HTMLButtonElement, RoundButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(roundButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
RoundButton.displayName = "RoundButton"

export { RoundButton, roundButtonVariants }