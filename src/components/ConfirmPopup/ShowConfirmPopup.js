import { confirmPopup } from "primereact/confirmpopup";

const showConfirmPopup = (
  event,
  message,
  accept,
  reject,
  icon = "pi pi-info-circle",
  defaultFocus = "reject",
  acceptClassName = "p-button-danger"
) => {
  console.log("called");
  confirmPopup({
    target: event.currentTarget,
    message: message,
    icon: icon,
    defaultFocus: defaultFocus,
    acceptClassName: acceptClassName,
    accept,
    reject,
  });
};

export { showConfirmPopup };
