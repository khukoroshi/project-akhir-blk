function Input({
  label,
  type = "text",
  name,
  placeholder = "",
  max,
  min,
  value,
  onChange,
  error,
  disabled = false,
  className = "",
  required = false,
  children,
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={name}
          className="
            mb-1
            block
            text-sm
            font-medium
            text-slate-700

            dark:text-slate-300
          "
        >
          {label}
        </label>
      )}

      <input
        id={name}
        name={name}
        type={type}
        max={max}
        min={min}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`
          w-full
          rounded-lg
          border
          border-slate-300
          bg-white
          px-3
          py-2
          text-slate-900
          outline-none
          transition

          placeholder:text-slate-400

          focus:border-indigo-500
          focus:ring-2
          focus:ring-indigo-500/20

          disabled:cursor-not-allowed
          disabled:bg-slate-100
          disabled:text-slate-500

          dark:border-slate-700
          dark:bg-slate-950
          dark:text-white
          dark:placeholder:text-slate-600

          dark:focus:border-indigo-400
          dark:focus:ring-indigo-400/20

          dark:disabled:bg-slate-800
          dark:disabled:text-slate-500

          ${className}
        `}
      />

      {error && (
        <span className="text-sm text-red-500 dark:text-red-400">{error}</span>
      )}

      {children}
    </div>
  );
}

export default Input;
