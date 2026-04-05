import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 px-4 py-3 text-sm text-gray-900 dark:text-white shadow-sm transition-all duration-300 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-teal-500 dark:focus-visible:border-teal-500 focus-visible:ring-4 focus-visible:ring-teal-500/10 dark:focus-visible:ring-teal-500/10",
        "aria-invalid:border-red-500 aria-invalid:ring-red-500/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
