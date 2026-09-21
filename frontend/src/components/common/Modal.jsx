function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/50
        p-4
        backdrop-blur-sm
        dark:bg-black/70
      "
      onClick={onClose}
    >
      <div
        className="
          max-h-[90vh]
          w-full
          max-w-md
          overflow-y-auto
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-6
          shadow-2xl
          transition-colors

          dark:border-slate-800
          dark:bg-slate-900
        "
        onClick={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <div className="mb-5 flex items-center justify-between">
          <h2
            className="
              text-xl
              font-bold
              tracking-tight
              text-slate-900

              dark:text-white
            "
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              text-xl
              leading-none
              text-slate-400
              transition

              hover:bg-slate-100
              hover:text-slate-700

              dark:text-slate-500
              dark:hover:bg-slate-800
              dark:hover:text-slate-200
            "
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* CONTENT */}
        {children}
      </div>
    </div>
  );
}

export default Modal;
