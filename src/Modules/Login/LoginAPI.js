import axios from "axios";
import { showErrorMessage, showWarningMessage } from "../../components/Toast/ShowMessage";

const loginCheck = async (credential,toastRef) => {
    try{
        const response= await axios.post(
            "http://localhost:8081/authenticate",credential
        );
        return response.data;
    } catch (error) {
        // console.error("Error fetching forminfo with versions:", error);
        const response=error.response.data;
        if(error.status===500){
            showErrorMessage(toastRef,"Error",response.error);
        }
        else{
            showWarningMessage(toastRef,"Warning",response.toString());
        }
        return null;
    }
}

const getUserInfo = async (token,credential) => {
    // try{
    //     const response= await axios.post(
    //         "http://localhost:8081/authenticate",credential
    //     );
    //     return response.data;
    // } catch (error) {
    //     // console.error("Error fetching forminfo with versions:", error);
    //     const response=error.response.data;
    //     if(error.status===500){
    //         showErrorMessage(toastRef,"Error",response.error);
    //     }
    //     else{
    //         showWarningMessage(toastRef,"Warning",response.toString());
    //     }
    //     return null;
    // }
    return {userId:"abhishek.bhowmick@greenwave.co.in",department:"Software",HomePage:"leave-management"}
}

export {loginCheck,getUserInfo}