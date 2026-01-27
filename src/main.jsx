import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "primereact/resources/themes/lara-light-blue/theme.css"; /* Theme */
import "primereact/resources/primereact.min.css"; /* Core CSS */
import "primeicons/primeicons.css"; /* Icons */
import { LoadingProvider } from "./components/LoadingScreen/LoadingContext.jsx";
import LoadingScreen from "./components/LoadingScreen/LoadingScreen.jsx";
import { BrowserRouter } from "react-router-dom";
import '../main.scss';
import ErrorBoundary from './ErrorBoundary.jsx'
createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <BrowserRouter>
    <LoadingProvider>
      <ErrorBoundary>
      <App />
      </ErrorBoundary>
      <LoadingScreen />
    </LoadingProvider>
  </BrowserRouter>
  // </StrictMode>,
);
