"use client";

import React from "react";
import Image from "next/image";

export function DecorativeMascot() {
  return (
    <aside
      aria-hidden="true"
      className="fixed top-20 right-2 sm:right-6 lg:right-10 pointer-events-none select-none z-0 opacity-85 sm:opacity-95 transition-all duration-300"
    >
      <div className="relative w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28">
        <Image
          src="/mascot.png"
          alt=""
          width={112}
          height={112}
          priority
          sizes="(max-width: 640px) 56px, (max-width: 768px) 80px, 112px"
          className="w-full h-full object-contain drop-shadow-sm"
        />
      </div>
    </aside>
  );
}
