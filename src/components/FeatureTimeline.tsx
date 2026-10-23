"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { ChevronLeft, ChevronRight, Clock, Download, Link2, PenLine, Share2, Upload, Users } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Horizontal, drag-and-flick feature timeline.
 *
 * One motion value (`pos`, measured in cards) drives everything: each card's
 * x, scale, dimming and stacking are derived from its distance to the
 * playhead, so drag, flick, wheel, buttons and keyboard all move the same
 * value and the visuals stay coherent. Release settles on the nearest card
 * with a spring; reduced motion jumps instead.
 */

/**
 * Icons are referenced by name so the step list can be defined in a server
 * component: functions cannot cross the server/client boundary as props.
 */
const ICONS = { pen: PenLine, upload: Upload, share: Share2, link: Link2, users: Users, clock: Clock, download: Download } as const;
export type TimelineIcon = keyof typeof ICONS;

export interface TimelineStep {
  id: string;
  label: string;
  title: string;
  text: string;
  icon: TimelineIcon;
}

const SPRING = { type: "spring", stiffness: 120, damping: 24, mass: 1 } as const;
const FLICK_MOMENTUM = 0.3; // cards per (card/ms) of velocity
const MAX_FLICK = 4;
const SIDE_SCALE = 0.72;
const SIDE_DIM = 0.45;
const DRAG_THRESHOLD_PX = 4;
const WHEEL_SETTLE_MS = 140;

interface Geometry {
  near: number; // x of the first neighbour
  step: number; // spacing between further cards
}

function cardX(offset: number, { near, step }: Geometry) {
  const a = Math.abs(offset);
  return Math.sign(offset) * (a <= 1 ? a * near : near + (a - 1) * step);
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function FeatureTimeline({
  steps,
  defaultIndex = 0,
  itemWidth = 320,
  className,
  "aria-label": ariaLabel = "Features",
}: {
  steps: TimelineStep[];
  defaultIndex?: number;
  itemWidth?: number;
  className?: string;
  "aria-label"?: string;
}) {
  const reduceMotion = useReducedMotion();
  const pos = useMotionValue(defaultIndex);
  const [active, setActive] = useState(defaultIndex);
  const [width, setWidth] = useState(itemWidth);
  const stageRef = useRef<HTMLDivElement>(null);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = steps.length - 1;
  const geometry: Geometry = { near: width * 0.82, step: width * 0.58 };
  const headingId = useId();

  // Fit cards on narrow screens.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.min(itemWidth, Math.max(240, entry.contentRect.width - 48)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [itemWidth]);

  const settle = useCallback(
    (target: number) => {
      const t = clamp(Math.round(target), 0, last);
      setActive(t);
      if (reduceMotion) pos.set(t);
      else animate(pos, t, SPRING);
    },
    [last, pos, reduceMotion],
  );

  // ---- pointer drag with flick momentum and rubber-banding ----
  const drag = useRef<{ startX: number; startPos: number; lastX: number; lastT: number; velocity: number; active: boolean } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    pos.stop();
    drag.current = { startX: e.clientX, startPos: pos.get(), lastX: e.clientX, lastT: e.timeStamp, velocity: 0, active: false };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    if (!d.active) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
      d.active = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    let next = d.startPos - dx / geometry.step;
    if (next < 0) next = next * 0.35;
    if (next > last) next = last + (next - last) * 0.35;
    const dt = Math.max(1, e.timeStamp - d.lastT);
    d.velocity = -(e.clientX - d.lastX) / geometry.step / dt;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    pos.set(next);
  }
  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.active) return; // a click; the card's own onClick handles it
    const projected = pos.get() + clamp(d.velocity * FLICK_MOMENTUM * 1000, -MAX_FLICK, MAX_FLICK);
    settle(projected);
  }

  // ---- wheel / trackpad ----
  function onWheel(e: React.WheelEvent) {
    const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
    if (dx === 0) return;
    e.preventDefault();
    pos.stop();
    pos.set(clamp(pos.get() + dx / geometry.step, -0.3, last + 0.3));
    if (wheelTimer.current) clearTimeout(wheelTimer.current);
    wheelTimer.current = setTimeout(() => settle(pos.get()), WHEEL_SETTLE_MS);
  }

  // ---- keyboard ----
  function onKeyDown(e: React.KeyboardEvent) {
    const map: Record<string, number> = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: last };
    if (e.key in map) {
      e.preventDefault();
      settle(map[e.key]);
      requestAnimationFrame(() => {
        stageRef.current?.querySelector<HTMLButtonElement>(`[data-index="${clamp(map[e.key], 0, last)}"]`)?.focus();
      });
    }
  }

  const activeStep = steps[active];

  return (
    <section
      aria-labelledby={headingId}
      className={cn("relative select-none", className)}
    >
      <div className="mb-4 flex items-end justify-between gap-4 px-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">What you get</p>
          <h2 id={headingId} className="mt-1 text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            Everything in one quiet place.
          </h2>
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          <NavButton label="Previous feature" onClick={() => settle(active - 1)} disabled={active === 0}>
            <ChevronLeft className="size-4" />
          </NavButton>
          <NavButton label="Next feature" onClick={() => settle(active + 1)} disabled={active === last}>
            <ChevronRight className="size-4" />
          </NavButton>
        </div>
      </div>

      <div
        ref={stageRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={-1}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
        className="relative h-[400px] cursor-grab touch-pan-y overflow-hidden rounded-3xl border border-border bg-card active:cursor-grabbing sm:h-[420px]"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        {/* playhead */}
        <div aria-hidden className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-brand/40 to-transparent" />

        {/* faint numerals */}
        {steps.map((s, i) => (
          <Numeral key={s.id} index={i} pos={pos} geometry={geometry} label={s.label} />
        ))}

        {/* ticks between cards */}
        {steps.slice(0, -1).map((s, i) => (
          <Ticks key={`ticks-${s.id}`} index={i} pos={pos} geometry={geometry} />
        ))}

        {/* cards */}
        {steps.map((s, i) => (
          <Card
            key={s.id}
            step={s}
            index={i}
            width={width}
            pos={pos}
            geometry={geometry}
            isActive={i === active}
            onSelect={() => settle(i)}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 px-1">
        <ol className="flex items-center gap-1.5" aria-label="Go to feature">
          {steps.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                aria-label={s.title}
                aria-current={i === active ? "step" : undefined}
                onClick={() => settle(i)}
                className={cn(
                  "pressable block h-1.5 rounded-full transition-[width,background-color] duration-200",
                  i === active ? "w-6 bg-brand" : "w-1.5 bg-border hover:bg-muted-foreground/50",
                )}
              />
            </li>
          ))}
        </ol>
        <p className="truncate text-sm text-muted-foreground" aria-live="polite">
          <span className="font-medium text-foreground">{activeStep.label}</span> · {activeStep.title}
        </p>
      </div>
    </section>
  );
}

function NavButton({ label, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="pressable flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
      {...rest}
    >
      {children}
    </button>
  );
}

function Card({
  step,
  index,
  width,
  pos,
  geometry,
  isActive,
  onSelect,
}: {
  step: TimelineStep;
  index: number;
  width: number;
  pos: MotionValue<number>;
  geometry: Geometry;
  isActive: boolean;
  onSelect: () => void;
}) {
  const x = useTransform(pos, (p) => cardX(index - p, geometry));
  const scale = useTransform(pos, (p) => {
    const a = Math.abs(index - p);
    return a <= 1 ? 1 - a * (1 - SIDE_SCALE) : SIDE_SCALE - Math.min(a - 1, 2) * 0.06;
  });
  const veil = useTransform(pos, (p) => Math.min(Math.abs(index - p), 1) * SIDE_DIM);
  const zIndex = useTransform(pos, (p) => Math.round(100 - Math.abs(index - p) * 10));
  const Icon = ICONS[step.icon];

  return (
    <motion.div
      style={{ x, scale, zIndex, width, left: "50%", marginLeft: -width / 2 }}
      className="absolute top-1/2 -translate-y-1/2"
    >
      <button
        type="button"
        data-index={index}
        tabIndex={isActive ? 0 : -1}
        aria-current={isActive ? "step" : undefined}
        onClick={onSelect}
        className="relative block w-full cursor-pointer rounded-2xl border border-border bg-background p-6 text-left shadow-[0_18px_50px_-24px_rgba(11,22,51,0.35)] outline-none focus-visible:ring-3 focus-visible:ring-brand/40"
      >
        <span className="mb-4 flex items-center justify-between">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
            <Icon className="size-5" />
          </span>
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-hover">{step.label}</span>
        </span>
        <span className="block text-lg font-semibold leading-snug text-navy">{step.title}</span>
        <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">{step.text}</span>
        {/* veil dims non-centred cards */}
        <motion.span aria-hidden style={{ opacity: veil }} className="pointer-events-none absolute inset-0 rounded-2xl bg-card" />
      </button>
    </motion.div>
  );
}

function Numeral({ index, pos, geometry, label }: { index: number; pos: MotionValue<number>; geometry: Geometry; label: string }) {
  const x = useTransform(pos, (p) => cardX(index - p, geometry));
  const opacity = useTransform(pos, (p) => (Math.abs(index - p) < 0.5 ? 0.07 : 0.035));
  return (
    <motion.span
      aria-hidden
      style={{ x, opacity, left: "50%" }}
      className="pointer-events-none absolute top-6 -translate-x-1/2 text-[7rem] font-extrabold leading-none tracking-tight text-navy sm:text-[8.5rem]"
    >
      {label}
    </motion.span>
  );
}

function Ticks({ index, pos, geometry }: { index: number; pos: MotionValue<number>; geometry: Geometry }) {
  // Five ticks in the gap between card `index` and `index + 1`.
  const x = useTransform(pos, (p) => cardX(index + 0.5 - p, geometry));
  const spread = geometry.step * 0.55;
  return (
    <motion.span aria-hidden style={{ x, left: "50%" }} className="pointer-events-none absolute bottom-6 flex -translate-x-1/2 items-end gap-0" >
      {[0, 1, 2, 3, 4].map((t) => (
        <span
          key={t}
          className={cn("mx-[1px] w-px rounded-full", t === 2 ? "h-4 bg-brand/50" : "h-2 bg-border")}
          style={{ marginLeft: t === 0 ? 0 : spread / 5 - 2 }}
        />
      ))}
    </motion.span>
  );
}
