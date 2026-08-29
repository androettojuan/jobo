export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 p-8 text-slate-500">
      <span
        aria-hidden
        className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
      <span className="text-sm">{label}</span>
    </div>
  )
}
