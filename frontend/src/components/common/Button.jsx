function Button({
  children,
  type = "button",
  variant = "primary",
  size = "medium",
  disabled = false,
  onClick,
  className = "",
}) {
  const variants = {
    primary: `
      bg-slate-900
      text-white
      hover:bg-slate-700

      dark:bg-white
      dark:text-slate-900
      dark:hover:bg-slate-200
    `,

    secondary: `
      bg-slate-100
      text-slate-900
      hover:bg-slate-200

      dark:bg-slate-800
      dark:text-white
      dark:hover:bg-slate-700
    `,

    danger: `
      bg-red-600
      text-white
      hover:bg-red-700

      dark:bg-red-500
      dark:hover:bg-red-600
    `,

    outline: `
      border
      border-slate-300
      bg-white
      text-slate-700
      hover:bg-slate-50

      dark:border-slate-700
      dark:bg-slate-900
      dark:text-slate-300
      dark:hover:bg-slate-800
    `,
  };

  const sizes = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2",
    large: "px-6 py-3 text-lg",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        rounded-lg
        font-medium
        transition

        disabled:cursor-not-allowed
        disabled:opacity-50

        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export default Button;
