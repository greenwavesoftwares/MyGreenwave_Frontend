import React, { useEffect, useRef } from "react";

const Poll = ({ func, interval, stop = true }) => {
  const intervalRef = useRef(null);
  useEffect(() => {
    if (stop) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    } else {
      func();
      intervalRef.current = setInterval(func, interval * 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stop]);
  return <div></div>;
};

export default Poll;
