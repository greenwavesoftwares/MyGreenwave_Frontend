// src/components/LoadingScreen/LoadingContext.jsx
import React, { createContext, useContext, useState } from "react";

const LoadingContext = createContext();

let setLoadingGlobal = () => {};

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  setLoadingGlobal = setIsLoading;

  return (
    <LoadingContext.Provider value={{ isLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const showLoading = () => setLoadingGlobal(true);
export const hideLoading = () => setLoadingGlobal(false);

export const useLoading = () => useContext(LoadingContext);
