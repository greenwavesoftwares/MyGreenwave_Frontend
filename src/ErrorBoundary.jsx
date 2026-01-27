import { Button } from "primereact/button";
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          <div
            className="flex align-items-center justify-content-center"
            style={{ height: "100vh", background: "#f4f6f8" }}
          >
            <div
              className="surface-card p-5 border-round-lg  text-center"
              style={{ maxWidth: "420px", width: "100%" }}
            >
              <i
                className="pi pi-exclamation-triangle text-7xl mb-3"
                style={{ color: "#ef4444" }}
              />

              <h2 className="mb-2 text-800">Oops! Something went wrong</h2>

              <p className="text-600 mb-4">
                An unexpected error occurred. Please try again.
              </p>
            </div>
          </div>
        </>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
