function Input({
  label,
  type = "text",
  name,
  placeholder = "",
  value,
  onChange,
  error,
  disabled = false,
  className = "",
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={name} className="font-medium">
          {label}
        </label>
      )}

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
        className={`
          rounded-md
          border
          px-3
          py-2
          outline-none
          focus:ring-2
          focus:ring-blue-500
          disabled:bg-gray-100
          ${className}
        `}
      />

      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
}

export default Input;
