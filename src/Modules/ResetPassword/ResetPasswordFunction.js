import {
  showErrorMessage,
  showSuccessMessage,
} from "../../../components/Toast/ShowMessage";
import { resetPasswordAPI } from "./ResetPasswordAPI";

const setNewPassword = async (
  resetPassword,
  toastRef,
  setResetPasswordValidation
) => {
  if (!resetPassword.newPassword || !resetPassword.confirmPassword) {
    showErrorMessage(toastRef, "Validation Error", "Please enter all fields");
    setResetPasswordValidation((prev) => ({
      ...prev,
      newPassword: resetPassword.newPassword ? false : true,
      confirmPassword: resetPassword.confirmPassword ? false : true,
    }));
    return;
  }
  if (resetPassword.newPassword !== resetPassword.confirmPassword) {
    showErrorMessage(
      toastRef,
      "Validation Error",
      "New password and confirm password should be same"
    );
    setResetPasswordValidation((prev) => ({
      ...prev,
      newPassword: true,
      confirmPassword: false,
    }));
    return;
  }

  let body = {};
  body.userId = resetPassword.userId;
  body.password = resetPassword.newPassword;

  const data = await resetPasswordAPI(body, toastRef);
  if (data) {
    showSuccessMessage(toastRef, "Success", "Password Reset Successfully");
  }
};
export { setNewPassword };
