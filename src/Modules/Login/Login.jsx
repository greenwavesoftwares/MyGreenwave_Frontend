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

const Login = () => {
  const [credential, setCredential] = useState({ username: "", password: "" });
  const navigate = useNavigate();
  const toastRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [wpDialogVisible, setWPDialogVisible] = useState(false);
  const [wpDialogMessage, setWPDialogMessage] = useState("");
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
    const loginCheck = await checkCredential(
      credential,
      toastRef,
      showWPDialog
    );
    if (loginCheck) {
      const userData = getUserData();
      const baseRoute = import.meta.env.VITE_BASE_ROUTE;
      navigate(`/${baseRoute}/${userData?.userDetails?.espHomepage}`);
    }
  };
  return (
    <>
      <Toast ref={toastRef}></Toast>
      {/* <Container maxWidth="md" className="h-screen grid items-center">
        <Grid container>
          <Grid size={{ md: 5, sm: 12 }}>
            <Card>
              <div className="w-full bg-white rounded-lg">
                <div className="text-center mb-5">
                  <Image
                    src={GreenwaveLogo}
                    alt="Image"
                    height="150"
                    width="150"
                    className="mb-3"
                    style={{ display: "inline-flex" }}
                  />
                  <div className="text-gray-600 text-3xl font-medium mb-3">
                    Welcome
                  </div>
                </div>

                <div className="text-center mb-3">
                  <TextField
                    fullWidth
                    label="Email"
                    variant="outlined"
                    margin="normal"
                    size="small"
                    onChange={(e) =>
                      setCredential({ ...credential, username: e.target.value })
                    }
                    slotProps={{
                      inputLabel: { shrink: true },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    variant="outlined"
                    margin="normal"
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

                 
                  <Button
                    label="Login"
                    className="text-md"
                    onClick={async () => {
                      const loginCheck = await checkCredential(
                        credential,
                        toastRef,
                        showWPDialog
                      );
                      if (loginCheck) {
                        const userData = getUserData();
                        const baseRoute = import.meta.env.VITE_BASE_ROUTE;
                        navigate(
                          `/${baseRoute}/${userData?.userDetails?.espHomepage}`
                        );
                      }
                    }}
                  ></Button>
                </div>
              </div>
            </Card>
          </Grid>
          <Grid
            size={{ md: 7, sm: 0 }}
            className="grid justify-center items-center"
          >
            <Image
              src={RightSideImage}
              alt="Image"
              height="500"
              width="450"
              className="mb-3 hidden md:block"
            />
          </Grid>
        </Grid>
      </Container> */}

      <div className="min-h-screen bg-gray-100 flex">
        {/* Left Section - Login Form */}
        <div className="flex-1 flex items-center justify-center p-1 bgColor">
          <div className="w-full max-w-md   px-5 py-6">
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

              <h1 className="text-base font-bold text-gray-900 mb-2 ml-1">
                Welcome to My Greenwave{" "}
              </h1>
              {/* <p className="text-gray-600 text-xs">
                Access your employee services, pay slips, leaves, and more — all in one place.
              </p> */}
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
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400">
            {/* <div className="absolute inset-0" style={{ backgroundColor: "#E6FDEC" }}> */}
            {/* Gradient Overlay */}

            {/* Main Content */}
            <div className="relative h-full flex flex-col justify-center items-center p-10 text-white">
              <div className="relative z-10 mb-2  p-1 ">
                <Image
                  src={RightSideImage}
                  alt="Image"
                  height="650"
                  width="450"
                  className=" hidden md:block"
                  style={{ height: "100%", width: "100%", objectFit: "cover" }}
                />
              </div>

              {/* Background Decorative Elements */}
            </div>
          </div>
        </div>
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
