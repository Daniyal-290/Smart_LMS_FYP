"use client";

export default function Button({
  children,
  onClick,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full
        cursor-pointer
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
