// src/components/LoadingScreen/LoadingContext.jsx
import React, { createContext, useContext, useState } from "react";

const LoadingContext = createContext();

let setLoadingGlobal = () => {};

const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  setLoadingGlobal = setIsLoading;

  return (
    <LoadingContext.Provider value={{ isLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

const showLoading = () => setLoadingGlobal(true);
const hideLoading = () => setLoadingGlobal(false);
const useLoading = () => useContext(LoadingContext);

export { LoadingProvider, showLoading, hideLoading, useLoading };
