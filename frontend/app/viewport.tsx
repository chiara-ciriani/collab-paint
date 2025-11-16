"use client";

import { useEffect } from "react";

export function Viewport() {
  useEffect(() => {
    // Force viewport meta tag
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.setAttribute("name", "viewport");
      document.head.appendChild(viewport);
    }
    viewport.setAttribute(
      "content",
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    );

    // Force font size
    document.documentElement.style.fontSize = "16px";
    document.body.style.fontSize = "16px";

    // Prevent zoom on double tap (mobile)
    let lastTouchEnd = 0;
    const preventZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };
    document.addEventListener("touchend", preventZoom, { passive: false });

    return () => {
      document.removeEventListener("touchend", preventZoom);
    };
  }, []);

  return null;
}

