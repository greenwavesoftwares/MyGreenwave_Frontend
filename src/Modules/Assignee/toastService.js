// toastService.js

let toastHandler = null;

export const registerToastHandler = (handler) => {
  toastHandler = handler;
};

export const showToast = (
  kind,
  title,
  msg = "",
  dur = 3800
) => {
  toastHandler?.(kind, title, msg, dur);
};