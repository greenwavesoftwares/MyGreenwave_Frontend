import React, { useEffect, useRef, useState } from "react";
import { setNewPassword } from "./ResetPasswordFunction";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import "./ResetPassword.css";
import { Grid } from "@mui/material";
import { Button } from "primereact/button";
import { Password } from "primereact/password";
import Toast from "../../../components/Toast/Toast";

const ResetPassword = ({ userInfo = {}, onHide, dialogVisible = false }) => {
  const toastRef = useRef(null);
  const resetPasswordStructure = {
    userId: "",
    newPassword: "",
    confirmPassword: "",
  };
  const resetPasswordValidationStructure = {
    newPassword: true,
    confirmPassword: true,
  };
  const [resetPassword, setResetPassword] = useState(resetPasswordStructure);
  const [resetPasswordValidation, setResetPasswordValidation] = useState(
    resetPasswordValidationStructure
  );

  useEffect(() => {
    if (dialogVisible)
      setResetPassword((prev) => ({
        ...prev,
        userId: userInfo?.userId,
      }));
    else {
      setResetPassword(resetPasswordStructure);
      setResetPasswordValidation(resetPasswordValidationStructure);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogVisible]);

  return (
    <>
      <DialogComponent
        header="Reset Password"
        visible={dialogVisible}
        onHide={onHide}
        className="resetPasswordDialog"
      >
        <Grid container>
          <Grid size={5} className="resetPasswordCell">
            <span className="font-bold">Enter New Password</span>
          </Grid>
          <Grid size={7} className="resetPasswordCell">
            <div className="card flex justify-content-center">
              <Password
                value={resetPassword.newPassword}
                toggleMask
                invalid={!resetPasswordValidation.newPassword}
                onChange={(e) =>
                  setResetPassword((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
              />
            </div>
          </Grid>
          <Grid size={5} className="resetPasswordCell">
            <span className="font-bold">Confirm Password</span>
          </Grid>
          <Grid size={7} className="resetPasswordCell">
            <div className="card flex justify-content-center">
              <Password
                value={resetPassword.confirmPassword}
                toggleMask
                invalid={!resetPasswordValidation.confirmPassword}
                onChange={(e) =>
                  setResetPassword((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
              />
            </div>
          </Grid>
          <Grid size={12} className="flex justify-content-center">
            <Button
              label="Set Password"
              icon="pi pi-key"
              severity="success"
              aria-label="Bookmark"
              className="mt-3 mr-2"
              onClick={async () => {
                setNewPassword(
                  resetPassword,
                  toastRef,
                  dialogVisible,
                  setResetPasswordValidation
                );
              }}
            />
          </Grid>
        </Grid>
      </DialogComponent>
      <Toast ref={toastRef} />
    </>
  );
};

export default ResetPassword;
