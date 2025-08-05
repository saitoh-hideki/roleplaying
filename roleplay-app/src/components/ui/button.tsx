import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl",
        outline: "border border-slate-600 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-slate-100 hover:border-slate-500",
        secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 shadow-lg hover:shadow-xl",
        ghost: "text-slate-300 hover:bg-slate-800 hover:text-slate-100",
        link: "text-indigo-400 underline-offset-4 hover:underline hover:text-indigo-300",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl",
        sky: "bg-sky-600 text-white hover:bg-sky-700 shadow-lg hover:shadow-xl",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }