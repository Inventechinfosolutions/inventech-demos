import { THEMES, setTheme, useTheme } from "@/theme/theme"

export function ThemeSwitch() {
  const theme = useTheme()
  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="inline-flex shrink-0 items-center rounded-full border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] p-0.5 text-xs font-semibold"
    >
      {THEMES.map((item) => {
        const active = theme === item.id
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(item.id)}
            className={
              active
                ? "rounded-full bg-[color:var(--c-bg-461220)] px-3 py-1.5 text-[color:var(--c-text-ffffff)]"
                : "rounded-full px-3 py-1.5 text-[color:var(--c-text-744d57)] hover:text-[color:var(--c-text-461220)]"
            }
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
