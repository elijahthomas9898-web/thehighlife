"use client";

import { useEffect } from "react";

type Particle = { x: number; y: number; r: number; vy: number; vx: number; a: number };

/**
 * All the scroll-driven behaviour in one place:
 * progress rail, sticky nav, hero parallax, reveal-on-scroll,
 * stat count-up, and the smoke canvas.
 */
export default function ScrollEffects() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const rail = document.getElementById("rail");
    const nav = document.getElementById("nav");
    const heroInner = document.getElementById("heroInner");


    function onScroll() {
      const h = document.documentElement;
      const sc = h.scrollTop || document.body.scrollTop;
      const max = h.scrollHeight - h.clientHeight || 1;
      if (rail) rail.style.width = `${(sc / max) * 100}%`;
      if (nav) nav.classList.toggle("solid", sc > 40);
      if (!reduce && heroInner && sc < window.innerHeight) {
        heroInner.style.transform = `translateY(${sc * 0.28}px)`;
        heroInner.style.opacity = String(Math.max(0, 1 - sc / (window.innerHeight * 0.85)));
      }
    }

    // reveal on scroll
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    // stat count-up
    let counted = false;
    const statsEl = document.getElementById("stats");
    let statIO: IntersectionObserver | null = null;
    if (statsEl) {
      statIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting || counted) return;
            counted = true;
            document.querySelectorAll<HTMLElement>(".stat .n").forEach((n) => {
              const target = Number(n.dataset.count || 0);
              const suffix = n.dataset.suffix || "";
              if (reduce) {
                n.textContent = `${target}${suffix}`;
                return;
              }
              let start: number | null = null;
              const step = (ts: number) => {
                if (start === null) start = ts;
                const p = Math.min((ts - start) / 1400, 1);
                n.textContent = `${Math.floor((1 - Math.pow(1 - p, 3)) * target)}${suffix}`;
                if (p < 1) requestAnimationFrame(step);
              };
              requestAnimationFrame(step);
            });
          });
        },
        { threshold: 0.4 }
      );
      statIO.observe(statsEl);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    // ambient smoke canvas
    const cv = document.getElementById("smoke") as HTMLCanvasElement | null;
    let raf = 0;
    const onResizeCanvas = () => {
      if (!cv) return;
      cv.width = cv.offsetWidth * Math.min(window.devicePixelRatio || 1, 2);
      cv.height = cv.offsetHeight * Math.min(window.devicePixelRatio || 1, 2);
    };

    if (cv) {
      const ctx = cv.getContext("2d");
      const DPR = Math.min(window.devicePixelRatio || 1, 2);
      onResizeCanvas();
      window.addEventListener("resize", onResizeCanvas);

      if (ctx && !reduce) {
        const mk = (): Particle => ({
          x: Math.random() * cv.width,
          y: cv.height + Math.random() * cv.height * 0.5,
          r: (40 + Math.random() * 120) * DPR,
          vy: -(0.15 + Math.random() * 0.4) * DPR,
          vx: (Math.random() - 0.5) * 0.3 * DPR,
          a: 0.02 + Math.random() * 0.05,
        });
        const parts: Particle[] = [];
        for (let i = 0; i < 26; i++) {
          const p = mk();
          p.y = Math.random() * cv.height;
          parts.push(p);
        }
        const draw = () => {
          ctx.clearRect(0, 0, cv.width, cv.height);
          for (let i = 0; i < parts.length; i++) {
            const p = parts[i];
            p.y += p.vy;
            p.x += p.vx;
            if (p.y + p.r < 0) {
              parts[i] = mk();
              continue;
            }
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
            g.addColorStop(0, `rgba(59,232,127,${p.a})`);
            g.addColorStop(1, "rgba(59,232,127,0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
          }
          raf = requestAnimationFrame(draw);
        };
        draw();
      } else {
        cv.style.opacity = "0.25";
      }
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("resize", onResizeCanvas);
      io.disconnect();
      statIO?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
