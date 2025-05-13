import React from "react";
import { useLoading } from "./LoadingContext";
import "./LoadingScreen.css";

const LoadingScreen = () => {
  const { isLoading } = useLoading();
  return null;
  // if (!isLoading) return null;

  // return (
  //   <div className="loading-overlay">
  //     <div className="spinner"></div>
  //     <p>Loading...</p>
  //   </div>
  // );
};

export default LoadingScreen;
