import { confirmDialog } from "primereact/confirmdialog";

export function showConfirm(header,message,accept,reject,icon='pi pi-exclamation-triangle',defaultFocus='accept') {
    confirmDialog({
        message: message,
        header: header,
        icon: icon,
        defaultFocus: defaultFocus,
        accept,
        reject
    });
}