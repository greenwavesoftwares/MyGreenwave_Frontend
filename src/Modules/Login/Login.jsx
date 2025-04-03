import { Container } from "@mui/material";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Image } from "primereact/image";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import React, { useState } from "react";
import "./Login.css";
import { getUserData, loginCheck } from "./LoginFunction";
import { useNavigate } from "react-router-dom";
import Grid from "../../components/Grid/Grid";

const Login = () => {
  const [credential, setCredential] = useState({ username: "", password: "" });
  const navigate = useNavigate();
  return (
    <Container maxWidth="md" className="LoginContainer">
      <Grid container>
        <Grid size={{ md: 5, sm: 12 }}>
          <Card>
            <div className="w-full surface-card">
              <div className="text-center mb-5">
                <Image
                  src="src\assets\Images\GreenwaveLogo.png"
                  alt="Image"
                  height="150"
                  width="150"
                  className="mb-3"
                  style={{ display: "inline-flex" }}
                />
                <div className="text-900 text-3xl font-medium mb-3">
                  Welcome
                </div>
              </div>

              <div className="text-center mb-3">
                <InputText
                  id="email1"
                  value={credential.username}
                  type="text"
                  placeholder="Email address"
                  onChange={(e) =>
                    setCredential({ ...credential, username: e.target.value })
                  }
                  className="mb-3"
                />

                <Password
                  inputId="password1"
                  value={credential.password}
                  onChange={(e) =>
                    setCredential({ ...credential, password: e.target.value })
                  }
                  placeholder="Password"
                  toggleMask
                  feedback={false}
                  className="mb-3"
                ></Password>

                {/* <div className="flex align-items-center justify-content-center mb-3 gap-5">
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
                  onClick={() => {
                    if (loginCheck(credential)) {
                      const userData = getUserData(credential);
                      if (userData != null) {
                        navigate("/" + userData.HomePage);
                      }
                    }
                  }}
                ></Button>
              </div>
            </div>
          </Card>
        </Grid>
        <Grid
          size={{ md: 7, sm: 0 }}
          className="grid justify-content-center align-content-center"
        >
          <Image
            src="src\assets\Images\RightSideImage.png"
            alt="Image"
            height="500"
            width="450"
            className="mb-3 DisplayNone"
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Login;
