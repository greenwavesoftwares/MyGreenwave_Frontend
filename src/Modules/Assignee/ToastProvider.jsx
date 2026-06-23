import React, { useCallback, useEffect, useRef, useState } from "react";
import Toast from "./Toast";
import { registerToastHandler } from "./toastService";

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback(
    (kind, title, msg = "", dur = 3800) => {
      const id = ++toastIdRef.current;

      setToasts((prev) => [
        ...prev,
        { id, kind, title, msg },
      ]);

      setTimeout(() => {
        setToasts((prev) =>
          prev.filter((t) => t.id !== id)
        );
      }, dur);
    },
    []
  );

  useEffect(() => {
    registerToastHandler(showToast);
  }, [showToast]);

  return (
    <>
      {children}

      <Toast
        toasts={toasts}
        onDismiss={(id) =>
          setToasts((prev) =>
            prev.filter((t) => t.id !== id)
          )
        }
      />
    </>
  );
}