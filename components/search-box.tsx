'use client'

export function SearchBox({
  label,
  placeholder,
  button,
}: {
  label: string
  placeholder: string
  button: string
}) {
  return (
    <form
      role="search"
      className="mt-8 flex flex-col gap-2 sm:flex-row"
      onSubmit={(event) => event.preventDefault()}
    >
      <label className="sr-only" htmlFor="lookup">
        {label}
      </label>
      <input
        id="lookup"
        name="q"
        type="search"
        placeholder={placeholder}
        autoComplete="off"
        className="h-12 w-full rounded-xl border border-line bg-card px-4 text-base text-ink outline-none placeholder:text-muted"
      />
      <button
        type="submit"
        className="h-12 shrink-0 rounded-xl bg-pine px-6 text-base font-medium text-white hover:bg-pine-dark"
      >
        {button}
      </button>
    </form>
  )
}
