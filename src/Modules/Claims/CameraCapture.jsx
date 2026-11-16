import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { bundleFiles } from "./claimFileUtils";

const MAX_PHOTOS = 10;
const TIMERS = [0, 3, 10]; // self-timer seconds
const MAX_DIGITAL_ZOOM = 4;

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
        0.92,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image"));
    };
    img.src = url;
  });

// getUserMedia only exists on HTTPS (or localhost). On plain HTTP it is undefined.
const canUseLiveCamera = () =>
  typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

/* ---------- styles ---------- */

const S = {
  root: {
    position: "fixed",
    inset: 0,
    zIndex: 10000,
    background: "#000",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    userSelect: "none",
    WebkitUserSelect: "none",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "max(10px, env(safe-area-inset-top)) 12px 10px",
    background: "rgba(0,0,0,0.55)",
    zIndex: 2,
  },
  iconBtn: (active) => ({
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "none",
    background: active ? "rgba(255,214,0,0.95)" : "rgba(255,255,255,0.16)",
    color: active ? "#000" : "#fff",
    fontSize: 18,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    position: "relative",
  }),
  badge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    fontSize: 10,
    fontWeight: 700,
    background: "#000",
    color: "#fff",
    borderRadius: 8,
    padding: "0 4px",
  },
  finder: {
    position: "relative",
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    background: "#000",
    touchAction: "none",
  },
  bottom: {
    padding: "10px 16px max(16px, env(safe-area-inset-bottom))",
    background: "rgba(0,0,0,0.65)",
    zIndex: 2,
  },
  shutterOuter: (disabled) => ({
    width: 74,
    height: 74,
    borderRadius: "50%",
    border: "4px solid #fff",
    background: "transparent",
    padding: 4,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
  }),
  shutterInner: (counting) => ({
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    background: counting ? "#e53935" : "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 26,
    fontWeight: 700,
  }),
  pill: {
    border: "none",
    borderRadius: 22,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    background: "rgba(255,255,255,0.18)",
    color: "#fff",
  },
};

/* ---------- component ---------- */

/**
 * Full-screen camera (phone-camera style) - multiple photos, no video.
 *
 * Features: full-screen, front/back switch, flash (torch), zoom (slider +
 * pinch, hardware zoom where the phone supports it, digital otherwise),
 * tap-to-focus, grid, self-timer, full-resolution stills where supported,
 * thumbnails with remove.
 *
 * HTTPS is required by browsers for a live camera. On plain HTTP the
 * component automatically falls back to the phone's own camera app / gallery
 * (which works on HTTP).
 *
 * Nothing is uploaded while photos are being taken. Only when the user taps
 * the tick is onCapture(file) called ONCE:
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
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const trackRef = useRef(null);
  const imageCaptureRef = useRef(null);
  const capsRef = useRef({});
  const photosRef = useRef([]);
  const pinchRef = useRef(null);
  const timerRef = useRef(null);
  const takePhotoRef = useRef(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [facingMode, setFacingMode] = useState("environment");
  const [deviceId, setDeviceId] = useState(null); // chosen lens (null = default for facingMode)
  const [lenses, setLenses] = useState([]); // cameras facing the same way [{id,label}]
  const [activeLens, setActiveLens] = useState(null);
  const [photos, setPhotos] = useState([]); // {id, blob, url}
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomCaps, setZoomCaps] = useState(null); // hardware zoom {min,max,step}
  const [zoom, setZoom] = useState(1);
  const [grid, setGrid] = useState(false);
  const [timerIdx, setTimerIdx] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [flashAnim, setFlashAnim] = useState(false);
  const [focusPoint, setFocusPoint] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  photosRef.current = photos;
  const liveCamera = canUseLiveCamera();
  const useFallback = !liveCamera || Boolean(error);
  const digitalZoom = !zoomCaps;
  const zoomMin = zoomCaps ? zoomCaps.min : 1;
  const zoomMax = zoomCaps ? zoomCaps.max : MAX_DIGITAL_ZOOM;
  const zoomStep = zoomCaps ? zoomCaps.step : 0.1;

  /* ----- stream ----- */

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    trackRef.current = null;
    imageCaptureRef.current = null;
    setReady(false);
  };

  const startStream = async (mode, devId = null) => {
    stopStream();
    setError("");
    if (!canUseLiveCamera()) return; // fallback UI is shown instead
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          ...(devId ? { deviceId: { exact: devId } } : { facingMode: { ideal: mode } }),
          // 4:3 uses the full sensor = widest field of view (16:9 crops it in)
          aspectRatio: { ideal: 4 / 3 },
          width: { ideal: 4032 },
          height: { ideal: 3024 },
        },
        audio: false, // photos only
      });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      trackRef.current = track;

      const caps = track.getCapabilities?.() || {};
      capsRef.current = caps;
      setTorchSupported(Boolean(caps.torch));
      setTorchOn(false);
      if (caps.zoom) {
        setZoomCaps({ min: caps.zoom.min, max: caps.zoom.max, step: caps.zoom.step || 0.1 });
        const start = Math.min(caps.zoom.max, Math.max(caps.zoom.min, 1));
        setZoom(start);
        track.applyConstraints({ advanced: [{ zoom: start }] }).catch(() => {});
      } else {
        setZoomCaps(null);
        setZoom(1);
      }
      if (caps.focusMode?.includes?.("continuous")) {
        track.applyConstraints({ advanced: [{ focusMode: "continuous" }] }).catch(() => {});
      }
      if (typeof window.ImageCapture !== "undefined") {
        try {
          imageCaptureRef.current = new window.ImageCapture(track);
        } catch {
          imageCaptureRef.current = null;
        }
      }

      // List the other cameras facing the same way (e.g. ultra-wide) so the user
      // can switch lens - the way to get a wider "zoom out" view on many phones.
      try {
        const devs = (await navigator.mediaDevices.enumerateDevices()).filter(
          (d) => d.kind === "videoinput",
        );
        const wantFront = mode === "user";
        const same = devs.filter((d) => {
          const isFront = /front|user|selfie/i.test(d.label || "");
          return wantFront ? isFront : !isFront;
        });
        setLenses(same.map((d) => ({ id: d.deviceId, label: d.label })));
        setActiveLens(track.getSettings?.().deviceId || devId || null);
      } catch {
        setLenses([]);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setReady(true);
    } catch (e) {
      setError(
        e?.name === "NotAllowedError"
          ? "Camera permission denied. Allow camera access in your browser settings, or use the phone camera below."
          : "Unable to access the live camera. You can use the phone camera below.",
      );
    }
  };

  const clearPhotos = () => {
    photosRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  };

  useEffect(() => {
    if (!visible) return undefined;
    // Full screen (best effort - needs a user gesture; the overlay is full-viewport anyway)
    rootRef.current?.requestFullscreen?.().catch(() => {});
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.body.style.overflow = prevOverflow;
      exitFullscreen();
      clearInterval(timerRef.current);
      setCountdown(0);
      stopStream();
      clearPhotos();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (visible) startStream(facingMode, deviceId);
    return stopStream;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, facingMode, deviceId]);

  /* ----- controls ----- */

  const applyZoom = (z) => {
    const v = Math.min(zoomMax, Math.max(zoomMin, z));
    setZoom(v);
    if (zoomCaps) {
      trackRef.current?.applyConstraints({ advanced: [{ zoom: v }] }).catch(() => {});
    }
  };

  // zoom out / in buttons (pinch and slider also work)
  const zoomDelta = zoomMax - zoomMin > 3 ? 0.5 : 0.25;
  const zoomOut = () => applyZoom(Math.round((zoom - zoomDelta) * 100) / 100);
  const zoomIn = () => applyZoom(Math.round((zoom + zoomDelta) * 100) / 100);

  const toggleTorch = async () => {
    const next = !torchOn;
    try {
      await trackRef.current?.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      onReject?.("Flash is not available on this camera.");
    }
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) exitFullscreen();
    else rootRef.current?.requestFullscreen?.().catch(() => {});
  };

  const handleTapFocus = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusPoint({ x, y, key: Date.now() });
    setTimeout(() => setFocusPoint(null), 900);
    const caps = capsRef.current;
    if (caps.focusMode?.includes?.("single-shot")) {
      const adv = { focusMode: "single-shot" };
      if (caps.pointsOfInterest) {
        adv.pointsOfInterest = [{ x: x / rect.width, y: y / rect.height }];
      }
      trackRef.current
        ?.applyConstraints({ advanced: [adv] })
        .then(() => {
          if (caps.focusMode.includes("continuous")) {
            setTimeout(() => {
              trackRef.current
                ?.applyConstraints({ advanced: [{ focusMode: "continuous" }] })
                .catch(() => {});
            }, 2500);
          }
        })
        .catch(() => {});
    }
  };

  // pinch to zoom
  const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const onTouchStart = (e) => {
    if (e.touches.length === 2) pinchRef.current = { d: dist(e.touches), z: zoom };
  };
  const onTouchMove = (e) => {
    if (e.touches.length === 2 && pinchRef.current) {
      applyZoom(pinchRef.current.z * (dist(e.touches) / pinchRef.current.d));
    }
  };
  const onTouchEnd = () => {
    pinchRef.current = null;
  };

  /* ----- capture ----- */

  const addPhoto = (blob) =>
    setPhotos((prev) => [
      ...prev,
      { id: `${Date.now()}_${prev.length}`, blob, url: URL.createObjectURL(blob) },
    ]);

  const grabFrame = () =>
    new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !video.videoWidth) return resolve(null);
      const z = digitalZoom ? zoom : 1; // hardware zoom is already in the stream
      const w = video.videoWidth;
      const h = video.videoHeight;
      const cw = w / z;
      const ch = h / z;
      canvas.width = cw;
      canvas.height = ch;
      canvas.getContext("2d").drawImage(video, (w - cw) / 2, (h - ch) / 2, cw, ch, 0, 0, cw, ch);
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92);
    });

  const takePhoto = async () => {
    if (!ready || photosRef.current.length >= maxPhotos) return;
    setFlashAnim(true);
    setTimeout(() => setFlashAnim(false), 140);
    navigator.vibrate?.(25);
    let blob = null;
    // Full-resolution still from the sensor where supported (not with digital zoom)
    if (imageCaptureRef.current && !(digitalZoom && zoom > 1.01)) {
      try {
        blob = await imageCaptureRef.current.takePhoto();
        if (blob && blob.type !== "image/jpeg") blob = await toJpeg(blob);
      } catch {
        blob = null;
      }
    }
    if (!blob) blob = await grabFrame();
    if (blob) addPhoto(blob);
  };
  takePhotoRef.current = takePhoto;

  const handleShutter = () => {
    if (countdown > 0) {
      clearInterval(timerRef.current); // cancel a running timer
      setCountdown(0);
      return;
    }
    const secs = TIMERS[timerIdx];
    if (!secs) {
      takePhotoRef.current();
      return;
    }
    let left = secs;
    setCountdown(left);
    timerRef.current = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(timerRef.current);
        setCountdown(0);
        takePhotoRef.current();
      } else {
        setCountdown(left);
      }
    }, 1000);
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
        const jpgs = photos.map(
          (p, i) =>
            new File([p.blob], `${fileNamePrefix}_${String(i + 1).padStart(2, "0")}.jpg`, {
              type: "image/jpeg",
            }),
        );
        file = await bundleFiles(jpgs, fileNamePrefix);
      }
      onCapture(file); // single upload
      onHide();
    } catch {
      setError("Failed to prepare the photos. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    if (photos.length && !window.confirm("Discard the photos you have taken?")) return;
    onHide();
  };

  // Fallback: phone's own camera app / gallery (works on HTTP too)
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
      for (const f of images.slice(0, maxPhotos - photosRef.current.length)) {
        addPhoto(await toJpeg(f));
      }
    } catch {
      onReject?.("Unable to read the selected image.");
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  const atLimit = photos.length >= maxPhotos;
  const videoTransform = `${facingMode === "user" ? "scaleX(-1) " : ""}scale(${digitalZoom ? zoom : 1})`;

  return createPortal(
    <div ref={rootRef} style={S.root}>
      {/* ---------- top bar ---------- */}
      <div style={S.topBar}>
        <button type="button" aria-label="Close camera" style={S.iconBtn(false)} onClick={handleClose}>
          <i className="pi pi-times" />
        </button>

        <div style={{ display: "flex", gap: 10 }}>
          {!useFallback && torchSupported && (
            <button
              type="button"
              aria-label="Flash"
              style={S.iconBtn(torchOn)}
              onClick={toggleTorch}
            >
              <i className="pi pi-bolt" />
            </button>
          )}
          {!useFallback && (
            <>
              <button
                type="button"
                aria-label="Timer"
                style={S.iconBtn(timerIdx > 0)}
                onClick={() => setTimerIdx((i) => (i + 1) % TIMERS.length)}
              >
                <i className="pi pi-clock" />
                {timerIdx > 0 && <span style={S.badge}>{TIMERS[timerIdx]}s</span>}
              </button>
              <button
                type="button"
                aria-label="Grid"
                style={S.iconBtn(grid)}
                onClick={() => setGrid((g) => !g)}
              >
                <i className="pi pi-th-large" />
              </button>
              {lenses.length > 1 && (
                <button
                  type="button"
                  aria-label="Switch lens (wide / normal / zoom)"
                  style={{ ...S.iconBtn(false), width: "auto", borderRadius: 22, padding: "0 12px", fontSize: 12, fontWeight: 700 }}
                  onClick={() => {
                    const idx = Math.max(0, lenses.findIndex((l) => l.id === activeLens));
                    setDeviceId(lenses[(idx + 1) % lenses.length].id);
                  }}
                >
                  Lens {Math.max(0, lenses.findIndex((l) => l.id === activeLens)) + 1}/{lenses.length}
                </button>
              )}
              <button
                type="button"
                aria-label="Switch camera"
                style={S.iconBtn(false)}
                onClick={() => {
                  setDeviceId(null);
                  setLenses([]);
                  setFacingMode((m) => (m === "environment" ? "user" : "environment"));
                }}
              >
                <i className="pi pi-sync" />
              </button>
            </>
          )}
          {document.fullscreenEnabled && (
            <button
              type="button"
              aria-label="Full screen"
              style={S.iconBtn(false)}
              onClick={toggleFullscreen}
            >
              <i className={isFullscreen ? "pi pi-window-minimize" : "pi pi-window-maximize"} />
            </button>
          )}
        </div>
      </div>

      {/* ---------- viewfinder ---------- */}
      <div
        style={S.finder}
        onClick={useFallback ? undefined : handleTapFocus}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {!useFallback ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                transform: videoTransform,
                transition: "transform 0.05s linear",
              }}
            />
            {grid && (
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                {[33.33, 66.66].map((p) => (
                  <div key={`v${p}`} style={{ position: "absolute", left: `${p}%`, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.45)" }} />
                ))}
                {[33.33, 66.66].map((p) => (
                  <div key={`h${p}`} style={{ position: "absolute", top: `${p}%`, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.45)" }} />
                ))}
              </div>
            )}
            {focusPoint && (
              <div
                key={focusPoint.key}
                style={{
                  position: "absolute",
                  left: focusPoint.x - 32,
                  top: focusPoint.y - 32,
                  width: 64,
                  height: 64,
                  border: "2px solid #ffd600",
                  borderRadius: 8,
                  pointerEvents: "none",
                }}
              />
            )}
            {countdown > 0 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 96,
                  fontWeight: 700,
                  textShadow: "0 2px 12px rgba(0,0,0,0.7)",
                  pointerEvents: "none",
                }}
              >
                {countdown}
              </div>
            )}
            {!ready && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, opacity: 0.8 }}>
                Starting camera…
              </div>
            )}
            {flashAnim && (
              <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: 0.85, pointerEvents: "none" }} />
            )}
          </>
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              padding: 24,
              textAlign: "center",
            }}
          >
            <i className="pi pi-camera" style={{ fontSize: 44, opacity: 0.8 }} />
            <p style={{ fontSize: 14, maxWidth: 320, opacity: 0.9 }}>
              {!liveCamera
                ? window.isSecureContext
                  ? "This browser does not allow live camera access here (in-app browsers and some embedded views block it). Try Chrome or Safari directly. You can still use your phone's camera app."
                  : "A live camera preview needs a secure (HTTPS) connection. You can still take photos with your phone's camera app."
                : error}
            </p>
            {!liveCamera && (
              <p style={{ fontSize: 11, maxWidth: 320, opacity: 0.6, wordBreak: "break-all" }}>
                Page address: {window.location.origin} - secure connection:{" "}
                {window.isSecureContext ? "yes" : "no"}
              </p>
            )}
            <button type="button" style={{ ...S.pill, background: "#2e7d32" }} disabled={atLimit || busy} onClick={() => cameraInputRef.current?.click()}>
              <i className="pi pi-camera" /> Open phone camera
            </button>
            <button type="button" style={S.pill} disabled={atLimit || busy} onClick={() => galleryInputRef.current?.click()}>
              <i className="pi pi-images" /> Choose from gallery
            </button>
            {liveCamera && (
              <button type="button" style={S.pill} onClick={() => startStream(facingMode)}>
                <i className="pi pi-refresh" /> Try live camera again
              </button>
            )}
          </div>
        )}
        <canvas ref={canvasRef} hidden />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFallbackChange} />
        <input ref={galleryInputRef} type="file" accept="image/*" multiple hidden onChange={handleFallbackChange} />
      </div>

      {/* ---------- bottom controls ---------- */}
      <div style={S.bottom}>
        {!useFallback && ready && zoomMax > zoomMin && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 6 }}>
              {zoomMin < 1 && (
                <button
                  type="button"
                  style={{ ...S.pill, padding: "4px 12px", fontSize: 12, background: Math.abs(zoom - zoomMin) < 0.05 ? "rgba(255,214,0,0.95)" : S.pill.background, color: Math.abs(zoom - zoomMin) < 0.05 ? "#000" : "#fff" }}
                  onClick={() => applyZoom(zoomMin)}
                >
                  {zoomMin.toFixed(1)}x
                </button>
              )}
              <button
                type="button"
                style={{ ...S.pill, padding: "4px 12px", fontSize: 12, background: Math.abs(zoom - 1) < 0.05 ? "rgba(255,214,0,0.95)" : S.pill.background, color: Math.abs(zoom - 1) < 0.05 ? "#000" : "#fff" }}
                onClick={() => applyZoom(1)}
              >
                1x
              </button>
              <span style={{ fontSize: 12, alignSelf: "center", minWidth: 40, textAlign: "center" }}>
                {zoom.toFixed(1)}x
              </span>
            </div>
            {zoomMin >= 1 && (
              <div style={{ fontSize: 11, opacity: 0.7, textAlign: "center", marginBottom: 6 }}>
                {zoomCaps ? "Phone zoom" : "Digital zoom"} range: {zoomMin.toFixed(1)}x - {zoomMax.toFixed(1)}x
                {" "}(this browser does not offer zoom below {zoomMin.toFixed(1)}x
                {lenses.length > 1 ? "; tap Lens at the top for a wider camera" : ""}).
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                aria-label="Zoom out"
                disabled={zoom <= zoomMin + 0.001}
                onClick={zoomOut}
                style={{ ...S.iconBtn(false), width: 38, height: 38, fontSize: 16, opacity: zoom <= zoomMin + 0.001 ? 0.4 : 1 }}
              >
                <i className="pi pi-search-minus" />
              </button>
              <input
                type="range"
                aria-label="Zoom"
                min={zoomMin}
                max={zoomMax}
                step={zoomStep}
                value={zoom}
                onChange={(e) => applyZoom(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                aria-label="Zoom in"
                disabled={zoom >= zoomMax - 0.001}
                onClick={zoomIn}
                style={{ ...S.iconBtn(false), width: 38, height: 38, fontSize: 16, opacity: zoom >= zoomMax - 0.001 ? 0.4 : 1 }}
              >
                <i className="pi pi-search-plus" />
              </button>
            </div>
          </div>
        )}

        {photos.length > 0 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "4px 0 10px" }}>
            {photos.map((p, i) => (
              <div key={p.id} style={{ position: "relative", flexShrink: 0 }}>
                <img
                  src={p.url}
                  alt={`Photo ${i + 1}`}
                  style={{ height: 56, width: 56, objectFit: "cover", borderRadius: 6, border: "1px solid rgba(255,255,255,0.5)" }}
                />
                <button
                  type="button"
                  aria-label={`Remove photo ${i + 1}`}
                  onClick={() => removePhoto(p.id)}
                  style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "none", background: "#e53935", color: "#fff", fontSize: 12, lineHeight: "20px", cursor: "pointer" }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, minWidth: 64, opacity: 0.9 }}>
            {photos.length}/{maxPhotos}
          </span>

          {!useFallback ? (
            <button
              type="button"
              aria-label="Take photo"
              style={S.shutterOuter(!ready || atLimit)}
              disabled={!ready || atLimit}
              onClick={handleShutter}
            >
              <div style={S.shutterInner(countdown > 0)}>{countdown > 0 ? "✕" : ""}</div>
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            aria-label="Use photos"
            disabled={!photos.length || busy}
            onClick={handleDone}
            style={{
              ...S.iconBtn(false),
              width: 56,
              height: 56,
              fontSize: 22,
              background: photos.length ? "#2e7d32" : "rgba(255,255,255,0.16)",
              opacity: photos.length ? 1 : 0.5,
            }}
          >
            <i className={busy ? "pi pi-spin pi-spinner" : "pi pi-check"} />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CameraCapture;
