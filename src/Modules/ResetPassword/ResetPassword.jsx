import React, { useEffect, useRef, useState } from "react";
import { setNewPassword } from "./ResetPasswordFunction";
import "./ResetPassword.css";
import { Grid } from "@mui/material";
import { Button } from "primereact/button";
import { Password } from "primereact/password";
import Toast from "../../components/Toast/Toast";
import { getUserData } from "../Login/Encrypt";
import { Container } from "postcss";

const ResetPassword = () => {
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
  const userDetails = getUserData()?.userDetails;

  useEffect(() => {
    setResetPassword((prev) => ({ ...prev, userId: userDetails.userId }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Container size="md">
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
                  setResetPasswordValidation
                );
              }}
            />
          </Grid>
        </Grid>
      </Container>
      <Toast ref={toastRef} />
    </>
  );
};

export default ResetPassword;
