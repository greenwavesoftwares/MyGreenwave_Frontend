import React, { useEffect, useRef, useState } from "react";
import { setNewPassword } from "./ResetPasswordFunction";
import "./ResetPassword.css";
import { Container, Grid } from "@mui/material";
import { Button } from "primereact/button";
import { Password } from "primereact/password";
import Toast from "../../components/Toast/Toast";
import { loginCheckAPI } from "../Login/LoginAPI";

export default function ResetPassword({
  userDetails, //prop containing user details
  currentPasswordCheck, //prop containing boolean value to check if to check the current password before resetting the password, or directly reset the password
}) {
  const toastRef = useRef(null); //reference of the toast showing messages
  const resetPasswordStructure = {
    userId: "",
    newPassword: "",
    confirmPassword: "",
  }; //constant to hold the structure of the reset password object
  const resetPasswordValidationStructure = {
    newPassword: true,
    confirmPassword: true,
  }; //constant to hold the structure of the reset password validation object
  const [resetPassword, setResetPassword] = useState(resetPasswordStructure); //state to store the reset password object
  const [resetPasswordValidation, setResetPasswordValidation] = useState(
    resetPasswordValidationStructure
  ); //state to store the reset password validation object
  const [currentPasswordDetails, setCurrentPasswordDetails] = useState({
    userId: "",
    currentPassword: "",
    isCurrentPasswordValid: false,
  }); //state to store the current password details

  //Function to show the toast message during wrong password log
  const showWrongPasswordDialog = (message) => {
    toastRef.current.show({
      severity: "error",
      summary: "Error",
      detail: message,
    });
  };

  //useEffect during component mount
  useEffect(() => {
    setResetPassword((prev) => ({ ...prev, userId: userDetails.userId })); //update the userId in the reset password object
    setCurrentPasswordDetails((prev) => ({
      ...prev,
      userId: userDetails.userId,
    })); //update the userId in the current password details object
  }, []);

  return (
    <>
      <Container size="md">
        {/* check whether current password validation is needed or not */}
        {currentPasswordCheck &&
          // check whether the current password is valid or not
          !currentPasswordDetails.isCurrentPasswordValid && (
            // If the current password is not valid then render this component
            <Grid container>
              {/* Grid to hold the label of current password details */}
              <Grid size={5} className="currentPasswordCell">
                <span className="font-bold">Enter Current Password</span>
              </Grid>
              {/* Grid to hold the input field of current password details */}
              <Grid size={5} className="currentPasswordCell">
                <div className="card flex justify-content-center">
                  <Password
                  className="NumberFieldStyle"
                    value={currentPasswordDetails.currentPassword}
                    toggleMask //Whether to show an icon to display the password as plain text.
                    feedback={false}
                    invalid={!currentPasswordDetails.currentPassword}
                    onChange={(e) =>
                      // update the currentPasswordDetails state with the new password
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
                  onClick={async () => {
                    const response = await loginCheckAPI(
                      {
                        username: currentPasswordDetails.userId,
                        password: currentPasswordDetails.currentPassword,
                      },
                      // check whether the current password is valid or not
                      toastRef, //pass the reference of the toast component to show wrong password message
                      showWrongPasswordDialog //function invoked when the password is incorrect
                    );
                    if (response != null) {
                      setCurrentPasswordDetails((prev) => ({
                        ...prev,
                        isCurrentPasswordValid: true,
                      }));
                      //if the password is valid then update the property isCurrentPasswordValid of state currentPasswordDetails to true
                    }
                  }}
                />
              </Grid>
            </Grid>
          )}
        {/* check whether to validate the current password or not */}
        {(!currentPasswordCheck ||
          // check whether the  current password is vaild or not
          currentPasswordDetails.isCurrentPasswordValid) && (
          // if one of the above check is true then render the below grid
          <Grid container>
            <Grid size={5} className="resetPasswordCell">
              <span className="font-bold">Enter New Password</span>
            </Grid>
            {/* grid to hold the new password input field */}
            <Grid size={7} className="resetPasswordCell">
              <div className="card flex justify-content-center">
                <Password
                  value={resetPassword.newPassword}
                  toggleMask
                  invalid={!resetPasswordValidation.newPassword}
                  onChange={
                    (e) =>
                      setResetPassword((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      })) //update the reset password object
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
                  onChange={
                    (e) =>
                      setResetPassword((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      })) //update the reset password object
                  }
                />
              </div>
            </Grid>
            <Grid size={12} className="flex justify-content-center">
              {/* button to submit the new password */}
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
                }} //validates whether the new password is matching with the confirm password
              />
            </Grid>
          </Grid>
        )}
      </Container>
      <Toast ref={toastRef} />
      {/* Toast to show messages */}
    </>
  );
}
