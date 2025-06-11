import React, { useRef } from "react";

const usePoll = (func, interval) => {
  const intervalRef = useRef(null);

  return {
    start: () => {
      if (!intervalRef.current) {
        func();
        intervalRef.current = setInterval(func, interval * 1000);
      }
    },
    stop: () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    },
  };
};

export default usePoll;
