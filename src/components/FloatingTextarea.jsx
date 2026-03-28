export default function FloatingTextarea({
  label,
  rows = 3,
  ...props
}) {
  return (
    <div className="relative pt-4">
      <textarea
        {...props}
        rows={rows}
        placeholder=" "
        className={`
          peer w-full rounded-xl px-4 py-3
          bg-transparent resize-none

          /* Light mode */
          text-neutral-900
          border border-neutral-300

          /* Dark mode */
          dark:text-white
          dark:border-white/30

          /* Focus */
          focus:outline-none
          focus:border-blue-500
          dark:focus:border-blue-400

          transition-all duration-200
        `}
      />

      <label
        className={`
          pointer-events-none absolute left-4 font-medium
          transition-all duration-200

          /* Light mode */
          text-neutral-500

          /* Dark mode */
          dark:text-white/80

          /* Start */
          top-6 text-lg

          /* Float when focused */
          peer-focus:top-0
          peer-focus:text-sm
          peer-focus:text-blue-600
          dark:peer-focus:text-blue-300

          /* Float when has value */
          peer-not-placeholder-shown:top-0
          peer-not-placeholder-shown:text-sm
        `}
      >
        {label}
      </label>
    </div>
  )
}
