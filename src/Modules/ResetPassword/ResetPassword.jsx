import React, { useEffect, useRef, useState } from "react";
import { setNewPassword } from "./ResetPasswordFunction";
import "./ResetPassword.css";
import { Container, Grid } from "@mui/material";
import { Button } from "primereact/button";
import { Password } from "primereact/password";
import Toast from "../../components/Toast/Toast";
import { getUserData } from "../Login/Encrypt";
import { loginCheck } from "../Login/LoginAPI";

export default function ResetPassword({ currentPasswordCheck }) {
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
  const [currentPasswordDetails, setCurrentPasswordDetails] = useState({
    userId: "",
    currentPassword: "",
    isCurrentPasswordValid: false,
  });
  const userDetails = getUserData()?.userDetails;
  const showWrongPasswordDialog = (message) => {
    console.log("Incorrect Password");
    toastRef.current.show({
      severity: "error",
      summary: "Error",
      detail: "Incorrect Password",
    });
  };

  useEffect(() => {
    console.log("Reset password:", resetPassword);
    setResetPassword((prev) => ({ ...prev, userId: userDetails.userId }));
    setCurrentPasswordDetails((prev) => ({
      ...prev,
      userId: userDetails.userId,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Container size="md">
        {currentPasswordCheck &&
          !currentPasswordDetails.isCurrentPasswordValid && (
            <Grid container>
              <Grid size={5} className="currentPasswordCell">
                <span className="font-bold">Enter Current Password</span>
              </Grid>

              <Grid size={5} className="currentPasswordCell">
                <div className="card flex justify-content-center">
                  <Password
                    value={currentPasswordDetails.currentPassword}
                    toggleMask
                    feedback={false}
                    invalid={!currentPasswordDetails.currentPassword}
                    onChange={(e) =>
                      setCurrentPasswordDetails((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                  />
                </div>
              </Grid>
              <Grid size={12} className="flex justify-content-center">
                <Button
                  label="Check"
                  icon="pi pi-key"
                  severity="success"
                  aria-label="Bookmark"
                  className="mt-3 mr-2"
                  onClick={async() => {
                    const response = await loginCheck(
                      {
                        username: currentPasswordDetails.userId,
                        password: currentPasswordDetails.currentPassword,
                      },
                      toastRef,
                      showWrongPasswordDialog
                    );
                    if(response!=null){
                      console.log("Response for reset password:",response)
                      setCurrentPasswordDetails((prev)=>({...prev,isCurrentPasswordValid:true}))
                    }
                  }}
                />
              </Grid>
            </Grid>
          )}
        {(!currentPasswordCheck ||
          currentPasswordDetails.isCurrentPasswordValid) && (
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
        )}
      </Container>
      <Toast ref={toastRef} />
    </>
  );
}
