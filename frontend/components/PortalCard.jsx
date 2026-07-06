"use client";

import Button from "./Button";

export default function PortalCard({
  icon,
  title,
  description,
  onClick,
  loading = false,
}) {
  return (
    <Button onClick={onClick} disabled={loading}>
      <div
        className="
          group
          relative
          w-full
          h-44
          overflow-hidden
          rounded-2xl
          bg-white/10
          backdrop-blur-md
          border
          border-white/30
          shadow-lg
          hover:shadow-2xl
          hover:-translate-y-1.5
          hover:border-white/50
          hover:bg-white/20
          transition-all
          duration-300
          flex
          items-center
          gap-6
          px-8
        "
      >
        {/* Left Accent */}
        <div
          className="
            absolute
            left-0
            top-0
            h-full
            w-1.5
            bg-white/60
            transition-colors
            group-hover:bg-amber-400
          "
        />

        {/* Icon */}
        <div
          className="
            flex
            items-center
            justify-center
            w-20
            h-20
            rounded-2xl
            bg-white/10
            border
            border-white/20
            text-white
            shadow-sm
            transition-all
            duration-300
            group-hover:scale-105
            group-hover:bg-white/20
            group-hover:border-white/40
          "
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 text-left">
          <h3
            className="
              text-xl
              font-bold
              text-white
              tracking-tight
            "
          >
            {title}
          </h3>

          <p
            className="
              mt-2
              text-sm
              leading-relaxed
              text-slate-200
            "
          >
            {description}
          </p>

          <div
            className="
              mt-5
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-white/80
              group-hover:text-amber-400
              transition-colors
            "
          >
            Open Portal
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </div>
        </div>
      </div>
    </Button>
  );
}
