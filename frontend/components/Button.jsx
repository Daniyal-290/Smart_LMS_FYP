"use client";

export default function Button({
  children,
  onClick,
  className = "",
  disabled = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        focus:outline-none
        focus:ring-2
        focus:ring-indigo-200
        rounded-2xl
        ${className}
      `}
    >
      {children}
    </button>
  );
}
