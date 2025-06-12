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
  return (
    <>
      <Toast ref={toastRef}></Toast>
      <Container maxWidth="md" className="h-screen grid items-center">
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

                  {/* <div className="flex align-items-center justify-center mb-3 gap-5">
                  <a
                    className="font-medium no-underline ml-2 text-right cursor-pointer"
                    style={{ color: "var(--primary-color)" }}
                  >
                    Forgot password?
                  </a>
                </div> */}
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
                        navigate(`/`);
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
      </Container>
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
