import React, { useState, useEffect } from "react";
import { PlayCircle } from "lucide-react";

/**
 * Pulsing icon (replaces CSS @keyframes pulse)
 */
export default function PulsingIcon({
  Icon = PlayCircle,
  size = 11,
  color = "#1D4ED8",
  duration = 1500,
}) {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = (now - start) % duration;
      const progress = elapsed / duration;
      const value = 0.7 + 0.3 * Math.cos(progress * Math.PI * 2);
      setOpacity(value);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [duration]);

  return (
    <Icon size={size} color={color} strokeWidth={2.5} style={{ opacity }} />
  );
}
