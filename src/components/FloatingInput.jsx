export default function FloatingInput({
  label,
  type = 'text',
  ...props
}) {
  return (
    <div className="relative pt-4">
      <input
        {...props}
        type={type}
        placeholder=" "
        className={`
          peer w-full rounded-xl px-4 py-3
          bg-transparent
          
          /* Default Light Mode */
          text-neutral-900
          border border-neutral-300

          /* Dark Mode */
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

          /* Default Light Mode */
          text-neutral-500

          /* Dark Mode */
          dark:text-white/80

          /* Start position */
          top-7 text-lg

          /* When active / focused */
          peer-focus:top-0
          peer-focus:text-sm
          peer-focus:text-blue-600
          dark:peer-focus:text-blue-300

          /* When value exists */
          peer-not-placeholder-shown:top-0
          peer-not-placeholder-shown:text-sm
        `}
      >
        {label}
      </label>
    </div>
  )
}
