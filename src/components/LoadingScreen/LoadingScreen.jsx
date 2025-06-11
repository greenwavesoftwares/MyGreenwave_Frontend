import React from "react";
import { useLoading } from "./LoadingContext";
import "./LoadingScreen.css";

const LoadingScreen = () => {
  const { isLoading } = useLoading();
  if (!isLoading) return null;

  return (
    // <div className="loading-overlay">
    //   <div className="spinner"></div>
    //    <p>Loading...</p>
    // </div>
    <div className="loading-overlay">
      <div className="loadingContainer">
        <div className="dot"></div>
        <div className="traveler"></div>
      </div>
      <svg width="0" height="0" className="svg">
        <defs>
          <filter id="uib-jelly-triangle-ooze">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="3.333"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="ooze"
            />
            <feBlend in="SourceGraphic" in2="ooze" />
          </filter>
        </defs>
      </svg>
      <p>Loading...</p>
    </div>
  );
};

export default LoadingScreen;
