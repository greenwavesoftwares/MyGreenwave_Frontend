import axios from "axios";

export const LoginCheck = async (credential) => {
    try{
        const response= await axios.post(
            "http://localhost:8081/authenticate",credential
        );
        return response.data;
    } catch (error) {
        // console.error("Error fetching forminfo with versions:", error);
        return error;
    }
}