export function showSuccessMessage (toast,header,message,life=3000) {
    toast.current.show({ severity:"success", summary: header, detail: message, life: life });
}
export function showInfoMessage (toast,header,message,life=3000) {
    toast.current.show({ severity:"info", summary: header, detail: message, life: life });
}
export function showWarningMessage (toast,header,message,life=3000) {
    toast.current.show({ severity:"warn", summary: header, detail: message, life: life });
}
export function showErrorMessage (toast,header,message,life=3000) {
    toast.current.show({ severity:"error", summary: header, detail: message, life: life });
}
export function showSecondaryMessage (toast,header,message,life=3000) {
    toast.current.show({ severity:"secondary", summary: header, detail: message, life: life });
}
export function showContrastMessage (toast,header,message,life=3000) {
    toast.current.show({ severity:"contrast", summary: header, detail: message, life: life });
}
  
