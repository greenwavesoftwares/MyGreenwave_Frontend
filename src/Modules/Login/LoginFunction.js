import { setUserData } from "./Encrypt";
import { loginCheck } from "./LoginAPI";
import { jwtDecode } from "jwt-decode";

const checkCredential=async (credential,toastRef)=>{
    let success=false;
    const userData={token:"",userDetails:{}};
    let data = await loginCheck(credential,toastRef);
    if(data!=null){
        userData.token=data.jwt;
        userData.userDetails=getUserDetails(data.jwt);
        if(userData.userDetails!=null){
            setUserData(userData);
            success=true;
        }
        else{
            success=false;
        }
    }
    else{
        success=false;
    }
    return success;
}

const getUserDetails = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded;
    } catch (error) {
      console.error("Invalid JWT token", error);
      return null;
    }
  };

export {checkCredential}