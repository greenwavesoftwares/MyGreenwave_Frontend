import { setUserData } from "./Encrypt";
import { getUserInfo, loginCheck } from "./LoginAPI";

const checkCredential=async (credential,toastRef)=>{
    let success=false;
    const userData={token:"",userDetails:{}};
    let data = await loginCheck(credential,toastRef);
    if(data!=null){
        userData.token=data.jwt;
        userData.userDetails=await getUserInfo(userData.token,credential);
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

export {checkCredential}