import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * Continuously rotating icon (replaces CSS @keyframes spin)
 */
export default function SpinningIcon({
  Icon = Loader2,
  size = 14,
  color = "#1D4ED8",
  duration = 1000,
}) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = (now - start) % duration;
      setRotation((elapsed / duration) * 360);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [duration]);

  return (
    <Icon
      size={size}
      color={color}
      style={{
        transform: `rotate(${rotation}deg)`,
        transition: "none",
      }}
    />
  );
}
