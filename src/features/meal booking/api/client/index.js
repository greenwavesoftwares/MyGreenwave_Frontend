import axios from "axios";

//Meal Booking Base URL
const mealBaseUrl = import.meta.env.VITE_END_POINT;

//Dashboard API Call
async function fetchDashboard(token) {
  try {
    const response = await axios.get(
      `${mealBaseUrl}usermeal/dashboard`,
      {
        headers: {
           "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("Api_Response",response);
    return response?.data;
  } catch (error) {
    console.log("failed to fetch dashboard api", error);
  }
}

//List of Meals API Call
async function ListOfMeals(token) {
  try {
    const response = await axios.get(
        `${mealBaseUrl}usermeal/meals/Lunch`,
      {
        headers: {
           "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("List OF all meal",response);
    return response?.data;
  } catch (error) {
    console.log("failed to fetch meal book api", error);
  }
  
}

async function ListOfSnacks(token) {
  try {
    const response = await axios.get(
        `${mealBaseUrl}usermeal/meals/ES`,
      {
        headers: {
           "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("List OF all snack",response);
    return response?.data;
  } catch (error) {
    console.log("failed to fetch meal book api", error);
  }
  
}

//Update Meal API Call
async function updateMeal(data,token) {
  try {
    const response = await axios.put(`${mealBaseUrl}usermeal/updatemeals`, data,{
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        meal_type: "lunch",
      },
    });
    console.log("meal update api response", response);
    return response;
  } catch (error) {
    console.log("failed to update meal", error);
    throw Error
  }
}

 async function  getMealBookingsByUserId  (userId,token) {
  try {
    

    const response = await axios.get(
      `${mealBaseUrl}usermeal/getbookedmealbyuserId`,
      {
        params: { userId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;

  } catch (error) {
    console.error("Failed to fetch meal bookings", error);
    throw error;
  }
};

export  {fetchDashboard,ListOfMeals,updateMeal,ListOfSnacks,getMealBookingsByUserId};
