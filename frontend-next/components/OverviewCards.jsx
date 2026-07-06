"use client";

import {
  BookOpen,
  ClipboardList,
  FileQuestion,
  GraduationCap,
} from "lucide-react";

export default function OverviewCards() {
  const cards = [
    {
      title: "Enrolled Courses",
      value: "6",
      description: "Active courses this semester",
      icon: <BookOpen size={28} />,
    },
    {
      title: "Pending Assignments",
      value: "4",
      description: "Need submission",
      icon: <ClipboardList size={28} />,
    },
    {
      title: "Upcoming Quizzes",
      value: "3",
      description: "Scheduled quizzes",
      icon: <FileQuestion size={28} />,
    },
    {
      title: "Current GPA",
      value: "3.54",
      description: "Current academic standing",
      icon: <GraduationCap size={28} />,
    },
  ];

  return (
    <section>
      <h2 className="text-2xl font-semibold text-slate-800 mb-5">
        Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="
              bg-slate-50
              border
              border-slate-200
              rounded-2xl
              p-6
              shadow-sm
              hover:bg-slate-100
              hover:shadow-md
              hover:-translate-y-1
              transition-all
              duration-300
            "
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">
                  {card.title}
                </p>

                <h3 className="text-4xl font-bold text-slate-800 mt-3">
                  {card.value}
                </h3>

                <p className="text-sm text-slate-600 mt-2">
                  {card.description}
                </p>
              </div>

              <div
                className="
                  h-12
                  w-12
                  flex
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-200
                  text-slate-700
                "
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
