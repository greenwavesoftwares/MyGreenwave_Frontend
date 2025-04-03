import { LoginCheck } from "./LoginAPI";

export function loginCheck(credential){
    const checkCredential= async()=>LoginCheck(credential);
    console.log(checkCredential());
    return true;
}
export function getUserData(credential){
    const userData={HomePage:"login"};
    return userData;
}