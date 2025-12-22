export default function FloatingTextarea({ label, rows = 3, ...props }) {
  return (
    <div className="relative pt-4">
      <textarea
        {...props}
        rows={rows}
        placeholder=" "
        className="
          peer w-full bg-transparent
          border border-white/30 rounded-xl
          px-4 py-3 text-white
          focus:outline-none focus:border-white
          resize-none
        "
      />

      <label
        className="
          pointer-events-none absolute left-4
          text-white/90 font-medium
          transition-all duration-200

          top-6 text-lg
          peer-focus:top-0 peer-focus:text-sm
          peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:text-sm
        "
      >
        {label}
      </label>
    </div>
  )
}
