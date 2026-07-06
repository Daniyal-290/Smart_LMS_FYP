"use client";

export default function DashboardSection({ title, text }) {
  return (
    <section
      className="
        bg-slate-50
        border
        border-slate-200
        rounded-2xl
        shadow-sm
        p-8
      "
    >
      <h2
        className="
          text-2xl
          font-semibold
          text-slate-800
          mb-3
        "
      >
        {title}
      </h2>

      <p
        className="
          text-slate-600
          leading-7
        "
      >
        {text}
      </p>
    </section>
  );
}
