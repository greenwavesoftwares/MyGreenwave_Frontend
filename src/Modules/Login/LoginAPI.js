import axios from "axios";
import { showErrorMessage, showWarningMessage } from "../../components/Toast/ShowMessage";

const endPoint = import.meta.env.VITE_END_POINT

const loginCheck = async (credential,toastRef) => {
    try{
        const response= await axios.post(
            `${endPoint}authenticate`,credential
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching forminfo with versions:", error);
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
const getUserDetails = async (token) => {
    try{
        const response= await axios.get(
            `${endPoint}users`,
            { headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }}
        );
        return response.data;
    } catch (error) {
         console.error("Error fetching forminfo with versions:", error);
        return null;
    }
}

export {loginCheck,getUserDetails}