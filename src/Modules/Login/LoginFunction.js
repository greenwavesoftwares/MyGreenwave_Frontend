import { Navigate } from "react-router-dom";
import { setUserData } from "./Encrypt";
import { loginCheck,getUserDetails } from "./LoginAPI";

const checkCredential=async (credential,toastRef)=>{
    let success=false;
    const userData={token:"",userDetails:{}};
    let data = await loginCheck(credential,toastRef);
    if(data!=null){
        userData.token=data.jwt;
        userData.userDetails=getUserDetail(data.jwt);
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

const getUserDetail = (token) => {
    const userDetails = getUserDetails(token);
    return userDetails;
};
export {checkCredential}