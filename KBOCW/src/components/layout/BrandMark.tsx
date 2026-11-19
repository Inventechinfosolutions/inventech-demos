export function BrandMark({ className = "h-14 w-14" }: { className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}brand/karnataka-emblem.png`}
      alt="Government of Karnataka"
      className={`shrink-0 rounded-full bg-black object-contain ring-1 ring-black/10 ${className}`}
    />
  )
}
