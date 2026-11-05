import { useEffect, useRef, useState } from "react";
import CustomDialog from "../../components/Dialog/DialogComponent";
import CustomButton from "../../components/Button/Button";

const MAX_PHOTOS = 10;

/* ---------- helpers ---------- */

// Normalise any image the browser can decode (PNG/HEIC/etc.) to a JPEG blob.
const toJpeg = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("JPEG conversion failed"))),
        "image/jpeg",
        0.9,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image"));
    };
    img.src = url;
  });

// CRC-32 (required by the ZIP format)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (bytes) => {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

// Dependency-free ZIP builder (store method - JPEGs are already compressed).
// files: [{ name, blob }]
const buildZip = async (files) => {
  const enc = new TextEncoder();
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  const parts = [];
  const central = [];
  let offset = 0;

  for (const { name, blob } of files) {
    const data = new Uint8Array(await blob.arrayBuffer());
    const nameBytes = enc.encode(name);
    const crc = crc32(data);

    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(6, 0x0800, true);
    lh.setUint16(8, 0, true);
    lh.setUint16(10, dosTime, true);
    lh.setUint16(12, dosDate, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true);
    lh.setUint32(22, data.length, true);
    lh.setUint16(26, nameBytes.length, true);
    lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), nameBytes, data);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true);
    ch.setUint16(12, dosTime, true);
    ch.setUint16(14, dosDate, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true);
    ch.setUint32(24, data.length, true);
    ch.setUint16(28, nameBytes.length, true);
    ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), nameBytes);

    offset += 30 + nameBytes.length + data.length;
  }

  const cdSize = central.reduce((n, b) => n + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);

  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: "application/zip" });
};

/* ---------- component ---------- */

/**
 * Camera capture dialog - multiple photos, no video.
 * Nothing is uploaded (and the table is not refreshed) while photos are being
 * taken. Only when the user taps "Done" is onCapture(file) called ONCE:
 *   1 photo   -> JPEG file
 *   2+ photos -> one ZIP file containing all the JPEGs
 */
const CameraCapture = ({
  visible,
  onHide,
  onCapture,
  onReject,
  fileNamePrefix = "capture",
  maxPhotos = MAX_PHOTOS,
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fallbackInputRef = useRef(null);
  const photosRef = useRef([]);

  const [facingMode, setFacingMode] = useState("environment");
  const [photos, setPhotos] = useState([]); // {id, blob, url}
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  photosRef.current = photos;

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
  };

  const startStream = async (mode) => {
    stopStream();
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera is not available in this browser (HTTPS is required).");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false, // photos only
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setReady(true);
    } catch (e) {
      setError(
        e?.name === "NotAllowedError"
          ? "Camera permission denied. Allow camera access in your browser settings."
          : "Unable to access the camera.",
      );
    }
  };

  const clearPhotos = () => {
    photosRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
  };

  useEffect(() => {
    if (visible) startStream(facingMode);
    else {
      stopStream();
      clearPhotos();
    }
    return stopStream;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, facingMode]);

  const addPhoto = (blob) =>
    setPhotos((prev) => [
      ...prev,
      { id: `${Date.now()}_${prev.length}`, blob, url: URL.createObjectURL(blob) },
    ]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || photos.length >= maxPhotos) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => blob && addPhoto(blob), "image/jpeg", 0.9);
  };

  const removePhoto = (id) =>
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });

  const handleDone = async () => {
    if (!photos.length) return;
    setBusy(true);
    try {
      const stamp = Date.now();
      let file;
      if (photos.length === 1) {
        file = new File([photos[0].blob], `${fileNamePrefix}_${stamp}.jpg`, { type: "image/jpeg" });
      } else {
        const zip = await buildZip(
          photos.map((p, i) => ({
            name: `${fileNamePrefix}_${String(i + 1).padStart(2, "0")}.jpg`,
            blob: p.blob,
          })),
        );
        file = new File([zip], `${fileNamePrefix}_${stamp}.zip`, { type: "application/zip" });
      }
      onCapture(file); // single upload -> single refresh
      onHide();
    } catch {
      setError("Failed to prepare the photos. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Fallback: native camera app / image picker (images only, several allowed)
  const handleFallbackChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length !== files.length) {
      onReject?.("Videos are not allowed. Please select photos only.");
    }
    if (!images.length) return;
    setBusy(true);
    try {
      for (const f of images.slice(0, maxPhotos - photos.length)) {
        addPhoto(await toJpeg(f));
      }
    } catch {
      onReject?.("Unable to read the selected image.");
    } finally {
      setBusy(false);
    }
  };

  const atLimit = photos.length >= maxPhotos;
  const cameraFailed = Boolean(error);

  return (
    <CustomDialog
      header={`Capture Document${photos.length ? ` (${photos.length}/${maxPhotos})` : ""}`}
      visible={visible}
      onHide={onHide}
      style={{ width: "min(95vw, 640px)" }}
      modal
    >
      <div className="flex flex-col items-center gap-3">
        <input
          ref={fallbackInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          hidden
          onChange={handleFallbackChange}
        />

        {cameraFailed ? (
          <p className="text-red-600 text-sm text-center py-2">{error}</p>
        ) : (
          <div
            className="w-full bg-black rounded overflow-hidden flex items-center justify-center"
            style={{ aspectRatio: "4 / 3" }}
          >
            <video ref={videoRef} playsInline muted autoPlay className="w-full h-full object-contain" />
          </div>
        )}
        <canvas ref={canvasRef} hidden />

        {photos.length > 0 && (
          <div className="flex gap-2 w-full overflow-x-auto py-1">
            {photos.map((p, i) => (
              <div key={p.id} className="relative shrink-0">
                <img src={p.url} alt={`Photo ${i + 1}`} className="h-16 w-16 object-cover rounded border" />
                <button
                  type="button"
                  aria-label={`Remove photo ${i + 1}`}
                  onClick={() => removePhoto(p.id)}
                  className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs leading-5"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 flex-wrap justify-center">
          {cameraFailed ? (
            <CustomButton
              icon="pi pi-camera"
              label={photos.length ? "Add more" : "Use device camera app"}
              className={photos.length ? "p-button-outlined" : ""}
              disabled={atLimit || busy}
              onClick={() => fallbackInputRef.current?.click()}
            />
          ) : (
            <>
              <CustomButton
                icon="pi pi-sync"
                className="p-button-outlined"
                tooltip="Switch camera"
                onClick={() => setFacingMode((m) => (m === "environment" ? "user" : "environment"))}
              />
              <CustomButton
                icon="pi pi-camera"
                label={photos.length ? "Add Photo" : "Capture"}
                disabled={!ready || atLimit || busy}
                onClick={handleCapture}
              />
            </>
          )}
          {photos.length > 0 && (
            <CustomButton
              icon="pi pi-check"
              label={photos.length > 1 ? `Done (${photos.length} → ZIP)` : "Done"}
              disabled={busy}
              onClick={handleDone}
            />
          )}
        </div>
        {atLimit && <p className="text-xs text-gray-500">Maximum {maxPhotos} photos reached.</p>}
      </div>
    </CustomDialog>
  );
};

export default CameraCapture;