import { useEffect } from "react";
import "./GreenwaveLoader.css";

/**
 * GreenWave loader
 * ----------------
 * The gear ring draws itself on from the blue metal, sweeps counter-clockwise
 * through the teal and green teeth, then grows the leaves from stem to tip —
 * closing the circle exactly where it started. The GREENWAVE wordmark stays
 * perfectly still in the middle.
 *
 *   import GreenWaveLoader, { GreenWaveLoaderOverlay } from './GreenWaveLoader';
 *
 *   <GreenWaveLoader />                          // default build animation
 *   <GreenWaveLoader mode="draw-spin" spark />   // build while rotating
 *   <GreenWaveLoader mode="spin" size={120} />   // classic spinner
 *   <GreenWaveLoader mode="static" size={52} />  // frozen logo, e.g. a header
 *
 *   <GreenWaveLoaderOverlay show={isLoading} />  // full-screen backdrop
 *
 * Next.js App Router: put 'use client' at the top of this file (it uses
 * useEffect for the legacy-browser fallback). Vite / CRA / Remix need nothing.
 */

const toLength = (v) => (typeof v === "number" ? `${v}px` : v);
const toTime = (v) => (typeof v === "number" ? `${v}s` : v);
const toAngle = (v) => (typeof v === "number" ? `${v}deg` : v);

const MODE_CLASS = {
  draw: "",
  "draw-spin": "gw-loader--draw-spin",
  spin: "gw-loader--spin",
  static: "gw-loader--static",
};

/**
 * Older engines (pre-Safari 16.4 / pre-Firefox 128) cannot animate the sweep
 * angles because they lack @property. They get a plain rotation instead, so
 * the mark never half-disappears. Runs after mount, so SSR stays consistent.
 */
function useDrawSupport() {
  useEffect(() => {
    if (
      !(
        typeof window !== "undefined" &&
        window.CSS &&
        window.CSS.registerProperty
      )
    ) {
      document.documentElement.classList.add("gw-no-draw");
    }
  }, []);
}

export default function GreenWaveLoader({
  /** Box size. Number → px, or any CSS length ('12rem', '20vmin'). */
  size = 260,
  /** Seconds for one full build → hold → unwind cycle. */
  speed = 3.2,
  /** 'draw' | 'draw-spin' | 'spin' | 'static' */
  mode = "draw",
  /** Travelling light that rides the drawing tip. */
  spark = false,
  /** Where the sweep starts and finishes, in degrees (0 = 12 o'clock).
   *  322° lands on blue gear metal just past the big leaf's tip, which is
   *  what makes the ring start blue and end on the leaf. */
  seam = 322,
  /** Rotation direction for the spin modes: 'normal' | 'reverse'. */
  direction = "normal",
  /** Seconds per rotation, spin modes only. */
  spinSpeed = 2.6,
  /** Announced by screen readers. Pass null for a purely decorative mark. */
  label = "Loading…",
  className = "",
  style,
  ...rest
}) {
  useDrawSupport();

  const decorative = mode === "static" || label === null;

  const classes = ["gw-loader", MODE_CLASS[mode] || "", className]
    .filter(Boolean)
    .join(" ");

  const vars = {
    "--gw-size": toLength(size),
    "--gw-speed": toTime(speed),
    "--gw-spin-speed": toTime(spinSpeed),
    "--gw-seam": toAngle(seam),
    "--gw-direction": direction,
    ...style,
  };

  return (
    <div
      className={classes}
      style={vars}
      role={decorative ? undefined : "status"}
      aria-hidden={decorative || undefined}
      {...rest}
    >
      <div className="gw-loader__ring" />
      <div className="gw-loader__word" />
      {spark && <div className="gw-loader__spark" />}
      {!decorative && <span className="gw-sr-only">{label}</span>}
    </div>
  );
}

/**
 * Full-screen backdrop around the loader. Keep it mounted and flip `show`
 * so it can fade out instead of popping:
 *
 *   const [loading, setLoading] = useState(true);
 *   useEffect(() => {
 *     const done = () => setLoading(false);
 *     if (document.readyState === 'complete') done();
 *     else window.addEventListener('load', done);
 *     return () => window.removeEventListener('load', done);
 *   }, []);
 *
 *   <GreenWaveLoaderOverlay show={loading} />
 */
export function GreenWaveLoaderOverlay({
  show = true,
  /** Text under the mark. Pass null to hide it. */
  caption = "Loading",
  /** Indeterminate progress bar under the caption. */
  bar = true,
  /** Backdrop colour, e.g. '#0a1820' for dark. */
  background,
  /** Props forwarded to the loader itself, e.g. {{ size: 200, spark: true }} */
  loaderProps,
  className = "",
  style,
  ...rest
}) {
  const classes = ["gw-overlay", show ? "" : "gw-overlay--hidden", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={background ? { "--gw-overlay-bg": background, ...style } : style}
      role="alert"
      aria-busy={show}
      {...rest}
    >
      <GreenWaveLoader {...loaderProps} />
      {caption && (
        <p className="gw-overlay__caption">
          {caption}
          <i>.</i>
          <i>.</i>
          <i>.</i>
        </p>
      )}
      {bar && (
        <div className="gw-overlay__bar">
          <span />
        </div>
      )}
    </div>
  );
}
