import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { Html5Qrcode } from "html5-qrcode";
import { updateMeal } from "../../api/client";
import { getUserData } from "../../../../Modules/Login/Encrypt";
import {
  showErrorMessage,
  showInfoMessage,
  showWarningMessage,
} from "../../../../components/Toast/ShowMessage";
import CryptoJS from "crypto-js";

export default function ScanQRCode({ setScanSuccessfullyDone }) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null); // holds Html5Qrcode instance
  const scannedRef = useRef(false); // mutable flag to avoid stale closures
  const toastRef = useRef(null);
  const readerId = "reader";
  const secretKey = "my_super_secret_key";
  const { token } = getUserData();

  // Auto start/stop scanner
  useEffect(() => {
    if (visible) startScanner();
    else stopScanner();

    // cleanup on unmount
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const startScanner = async () => {
    // ensure previous scanner cleaned up
    await stopScanner();

    scannedRef.current = false; // reset the "already scanned" flag
    setLoading(true);

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        showErrorMessage(toastRef, "Camera Error", "No camera found!");
        setLoading(false);
        return;
      }

      const cameraId =
        devices.find((d) => d.label && d.label.toLowerCase().includes("back"))
          ?.id || devices[0].id;

      const html5QrCode = new Html5Qrcode(readerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { deviceId: { exact: cameraId } },
        { fps: 10, qrbox: { width: 350, height: 350 }, disableFlip: false },
        // success callback
        async (decodedText) => {
          try {
            if (scannedRef.current) return; // already handled a scan
            scannedRef.current = true; // lock further scans

            console.log("decodedText", decodedText);

            // Decrypt and parse safely
            let decryptedData = null;
            try {
              const bytes = CryptoJS.AES.decrypt(decodedText, secretKey);
              const plaintext = bytes.toString(CryptoJS.enc.Utf8);
              if (!plaintext) {
                throw new Error("Decryption resulted in empty text");
              }
              decryptedData = JSON.parse(plaintext);
            } catch (e) {
              console.error("Decryption/parse failed:", e);
              showErrorMessage(toastRef, "Scan Error", "Invalid QR payload");
              // stop scanner and close
              await stopScanner();
              setVisible(false);
              setLoading(false);
              return;
            }

            //Previous Data Validation
            const currentData = new Date().toISOString().split("T")[0];
            console.log("currentData", currentData, decryptedData?.date);
            if (decryptedData?.date !== currentData) {
              showErrorMessage(
                toastRef,
                "Scan Error",
                "QR code is not valid for today",
              );
              await stopScanner();
              setVisible(false);
              setLoading(false);
              return;
            }

            //console.log("decryptedData", decryptedData);

            // Example logic for mealOn values
            //IMPORTANT API call if meal on
            if (decryptedData?.mealOn === 1) {
              //NOTE API Payload
              const data = [
                {
                  date: decryptedData?.date,
                  userId: decryptedData?.userId,
                  time: "Lunch",
                  mealOn: 1,
                  roti: 0,
                  scanned: true,
                  extraMeal: 0,
                  menu: "No Menu Added",
                },
              ];

              try {
                const response = await updateMeal(data, token);
                if (response.status === 200) {
                  showInfoMessage(
                    toastRef,
                    decryptedData?.mealOn ? "ON" : "OFF",
                    "You're all set! Your meal plan is already active.",
                  );
                }
                setScanSuccessfullyDone(true);
              } catch (err) {
                console.error("API call failed:", err);
                showErrorMessage(
                  toastRef,
                  "Scan Error",
                  "API call failed. Please try again",
                );
              }
            } else if (decryptedData?.mealOn === 0) {
              //NOTE API Payload
              const data = [
                {
                  date: decryptedData?.date,
                  userId: decryptedData?.userId,
                  time: "Lunch",
                  mealOn: 1,
                  roti: 0,
                  scanned: true,
                  extraMeal: 0,
                  menu: "No Menu Added",
                },
              ];

              try {
                const response = await updateMeal(data, token);
                if (response.status === 200) {
                  setScanSuccessfullyDone(true);
                  showWarningMessage(
                    toastRef,
                    decryptedData?.mealOn ? "OFF" : "ON",
                    `Meal already off after scan. User ID: ${decryptedData?.userId}. Meal booked.`,
                  );
                }
              } catch (err) {
                console.error("API call failed:", err);
                showErrorMessage(
                  toastRef,
                  "Scan Error",
                  "API call failed. Please try again",
                );
              }
            } else {
              showErrorMessage(toastRef, "Scan Error", "Unexpected QR data");
            }

            // Example payload to send to API (customize as needed)
            // Optionally call your backend
            // try {
            //   const response = await updateMeal(data, token);
            //   if (response.status === 200) {
            //     showSuccessMessage(toastRef, "Scan Result", "Scanned successfully!");
            //   } else {
            //     showErrorMessage(toastRef, "API Error", "Failed to update meal");
            //   }
            // } catch (err) {
            //   console.error("API call failed:", err);
            //   showErrorMessage(toastRef, "Scan Error", "API call failed. Please try again");
            // }

            // stop scanner after handling scan
            await stopScanner();
            setVisible(false);
            setLoading(false);
          } catch (outerErr) {
            console.error("Error handling scan result:", outerErr);
            showErrorMessage(
              toastRef,
              "Scan Error",
              "An unexpected error occurred",
            );
            await stopScanner();
            setVisible(false);
            setLoading(false);
          }
        },
        // error callback (frame errors etc.)
        (errorMessage) => {
          // ignore per-frame not-found errors
          console.log("Scanning frame error (ignored):", errorMessage);
        },
      );

      setLoading(false);
    } catch (err) {
      console.error("Camera start failed:", err);
      setLoading(false);
      showErrorMessage(
        toastRef,
        "Camera Error",
        "Camera permission denied or not available. Please allow camera access.",
      );
    }
  };

  const stopScanner = async () => {
    const instance = scannerRef.current;
    if (!instance) return;

    try {
      // stop() may throw if not started; guard with try/catch
      try {
        await instance.stop();
      } catch (stopErr) {
        console.warn("stop() raised:", stopErr);
      }

      try {
        await instance.clear();
      } catch (clearErr) {
        console.warn("clear() raised:", clearErr);
      }
    } catch (e) {
      console.error("Error stopping/clearing scanner:", e);
    } finally {
      // ensure we remove the reference so a new Html5Qrcode can be created later
      scannerRef.current = null;
      scannedRef.current = false;
    }
  };

  // ensure we stop scanner when user closes dialog via the Dialog's onHide
  const handleHide = async () => {
    await stopScanner();
    setVisible(false);
  };

  return (
    <div>
      <Toast ref={toastRef} />

      <Button
        label="Open Scanner"
        icon="pi pi-camera"
        rounded
        style={{
          padding:"0.35rem 0.85rem",
          fontSize:"0.85rem"
        }}
        size="small"
        onClick={() => setVisible(true)}
      />

      <Dialog
        header="Scan QR Code"
        visible={visible}
        style={{ width: "450px" }}
        modal
        onHide={handleHide}
      >
        {loading && (
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <ProgressSpinner style={{ width: "40px", height: "40px" }} />
            <p>Starting camera...</p>
          </div>
        )}
        <div
          id={readerId}
          style={{
            width: "100%",
            minHeight: "300px",
            borderRadius: "10px",
            overflow: "hidden",
            border: "2px solid #4CAF50",
          }}
        />
      </Dialog>
    </div>
  );
}
