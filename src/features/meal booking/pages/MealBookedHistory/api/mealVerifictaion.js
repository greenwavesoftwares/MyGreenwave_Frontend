import axios from "axios";

const mealBaseUrl = import.meta.env.VITE_END_POINT;

//Meal Verification API Call
async function mealVerification(token) {
  try {
    const response = await axios.get(`${mealBaseUrl}adminmeal/scannedDetails`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.log("failed to fetch meal verification api", error);
  }
}

export {mealVerification}
