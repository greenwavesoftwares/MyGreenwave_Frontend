import axios from "axios";
const endPoint = import.meta.env.VITE_END_POINT;


//Get user data
const getUserDataAPI = async (token) => {
  try {
    const response = await axios.get(`${endPoint}users`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.log(error);
  }
};


//Dummy API for home page
const homePageApi = async () => {
  try {
    const response = await axios.get(
      "http://localhost:8070/homepage-notification"
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export  {homePageApi,getUserDataAPI};
