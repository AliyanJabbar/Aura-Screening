import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#e6dfd8]/70 dark:bg-[#2e2c29]", className)}
      {...props}
    />
  )
}

export { Skeleton }
