import {
  Container,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Image } from "primereact/image";
import React, { useRef, useState } from "react";
import "./Login.css";
import { checkCredential } from "./LoginFunction";
import { useNavigate } from "react-router-dom";
import Grid from "../../components/Grid/Grid";
import Toast from "../../components/Toast/Toast";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import DialogComponent from "../../components/Dialog/DialogComponent";
import GreenwaveLogo from "../../assets/Images/GreenwaveLogo.png";
import RightSideImage from "../../assets/Images/RightSideImage.png";
import { getUserData } from "./Encrypt";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import LoginBGImage from "../../assets/Images/BG_Image.png";

const Login = () => {
  const [credential, setCredential] = useState({ username: "", password: "" });
  const navigate = useNavigate();
  const toastRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [wpDialogVisible, setWPDialogVisible] = useState(false);
  const [wpDialogMessage, setWPDialogMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const showWPDialog = (message) => {
    setWPDialogMessage(message);
    setWPDialogVisible(true);
  };
  const loginOnEnterPress = async (e) => {
    if (e.key === "Enter") {
      await onLoginClick();
    }
  };
  const onLoginClick = async () => {
    setLoading(true);
    const loginCheck = await checkCredential(
      credential,
      toastRef,
      showWPDialog
    );
    setLoading(false);
    if (loginCheck) {
      const userData = getUserData();
      const baseRoute = import.meta.env.VITE_BASE_ROUTE;
      navigate(`/${baseRoute}/${userData?.userDetails?.espHomepage}`);
    }
  };
  return (
    <>
      <Toast ref={toastRef}></Toast>

      <div
        className="min-h-screen flex bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${LoginBGImage})` }}
      >
        {" "}
         <div className=" md:w-[40%] flex items-center justify-center p-4 bg-white/90">
          <div className="w-full max-w-md px-5 py-6">
            {/* Logo */}
            <div className="mb-3">
              <Image
                src={GreenwaveLogo}
                alt="Image"
                height="52"
                width="52"
                className="mb-3 ml-1"
                style={{ display: "inline-flex" }}
              />

              <h1 className="text-base font-bold mb-2 ml-1">
                Welcome to My Greenwave{" "}
              </h1>
            </div>

            {/* Form */}
            <div
              className="space-y-7"
              onKeyDown={async (e) => {
                await loginOnEnterPress(e);
              }}
            >
              {/* Email Field */}
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                style={{ margin: "0.7rem 0", borderRadius: "5rem" }}
                placeholder="Enter your email"
                margin="normal"
                size="small"
                className="InputFiledStyle pr-4"
                onChange={(e) =>
                  setCredential({ ...credential, username: e.target.value })
                }
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />

              {/* Password Field */}
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                margin="normal"
                className="InputFiledStyle pr-4"
                placeholder="Enter your password"
                size="small"
                onChange={(e) =>
                  setCredential({ ...credential, password: e.target.value })
                }
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? (
                            <Visibility fontSize="small" />
                          ) : (
                            <VisibilityOff fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                  inputLabel: { shrink: true },
                }}
              />

              {/* Sign Up Link */}
              <div className=" mt-3">
                <Button
                  label="Login"
                  loading={loading}
                  size="small"
                  icon="pi pi-sign-in mr-2"
                  rounded
                  className="text-md px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  onClick={async () => {
                    await onLoginClick();
                  }}
                ></Button>
              </div>
            </div>
          </div>
        </div>
        {/* Right Section - Hero Image */}
      </div>
      <DialogComponent
        header="Warning"
        visible={wpDialogVisible}
        onHide={() => {
          if (!wpDialogVisible) return;
          setWPDialogVisible(false);
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <i
            className="pi pi-exclamation-triangle"
            style={{ fontSize: "2rem", marginRight: "1rem" }}
          ></i>
          {wpDialogMessage}
        </div>
      </DialogComponent>
    </>
  );
};

export default Login;
