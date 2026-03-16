import axios from "axios";

//Meal Booking Base URL
const mealBaseUrl = import.meta.env.VITE_END_POINT;

//Admin Dashboard API Call
async function fetchAdminDashboard(token) {
  try {
    const response = await axios.get(`${mealBaseUrl}adminmeal/dashboard`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response?.data;
  } catch (error) {
    console.log("failed to fetch admin dashboard api", error);
  }
}

//Expense Table API Call
async function fetchExpense(token) {
  try {
    const response = await axios.get(`${mealBaseUrl}adminmeal/expense`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response?.data;
  } catch (error) {
    console.log("failed to fetch expense api", error);
    throw error;
  }
}

//Insert Expense API Call
async function addNewExpense(token, data) {
  try {
    const response = await axios.post(`${mealBaseUrl}adminmeal/expense`, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.log("failed to add new expense api", error);
    throw new Error("Unable to add the expense");
  }
}

//Update Expense API Call
async function updateExpense(token, data) {
  try {
    const response = await axios.put(`${mealBaseUrl}adminmeal/expense`, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.log("failed to update expense api", error);
    throw error;
  }
}

//Expense Delete API Call
async function expenseDelete(token, data) {
  console.log("data", data, token);
  try {
    const response = await axios.delete(
      `${mealBaseUrl}adminmeal/expense?date=${data.date}&time=${data.time}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response;
  } catch (error) {
    console.log("failed to delete expense ", error);
    throw error;
  }
}

//IMPORTANT Get Expense Summary Excel Download
async function getSummary(token, data) {
  try {
    const response = await axios.post(
      `${mealBaseUrl}adminmeal/getsummary`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const { fileName, fileType, data: fileData } = response.data;
    // Base64 → Blob
    const binary = atob(fileData);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: fileType });
    // Download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ||  `MealSummary_Month-${data.month}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    return response;

    // const url = window.URL.createObjectURL(new Blob([response.data?.data]));
    // const link = document.createElement("a");
    // link.href = url;
    // link.setAttribute("download", `MealSummary_Month-${data.month}.xlsx`);
    // document.body.appendChild(link);
    // link.click();
    // link.remove();
    // return response;
  } catch (error) {
    console.log("excel download api error", error);
    throw error;
  }
}

 
export {
  fetchAdminDashboard,
  fetchExpense,
  expenseDelete,
  updateExpense,
  addNewExpense,
  getSummary,
 
};
