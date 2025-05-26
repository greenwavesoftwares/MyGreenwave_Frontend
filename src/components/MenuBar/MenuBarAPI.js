import axios from "axios";
const endPoint = import.meta.env.VITE_END_POINT;


//Get User Page Info
const getUserPageInfo = async (token) => {
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

export { getUserPageInfo };