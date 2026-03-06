import { Button } from "@mui/material";
import { Dialog } from "primereact/dialog";
import { Rating } from "primereact/rating";
import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Toast } from "primereact/toast";
import {
  showSuccessMessage,
  showWarningMessage,
} from "../../../../components/Toast/ShowMessage.js";
import { getUserData } from "../../../../Modules/Login/Encrypt.js";
import { mealVerification } from "../MealBookedHistory/api/mealVerifictaion.js";
import { updateMeal } from "../../api/client";

function MealFeedback() {
  const [visible, setVisible] = useState(false);
  const [todayMealBooked, setTodayMealBooked] = useState([]);
  const [loader, setLoader] = useState(false);
  const [isFeedbackGiven, setIsFeedbackGiven] = useState(false);
  const [fetchMealBookingLoader, setFetchMealBookingLoader] = useState(false);
  const [isTodayMealBooked, setIsTodayMealBooked] = useState(false);
  const [isUserScanned, setIsUserScanned] = useState(false);

  //For Toast
  const toastRef = useRef(null);
  //Get User Token
  const userDetails = getUserData();

  //NOTE Fetch Meal Booking Data for today
  async function fetchMealBooking() {
    try {
      setFetchMealBookingLoader(true);
      const response = await mealVerification(userDetails?.token);
      console.log("api_response", response.data.today);
      if (response.status === 200) {
        setTodayMealBooked(response?.data.today);
        //Check if feedback is already given
        //Get Employee Id
        const emp_id = userDetails.userDetails.employeeId;
        //Check Employee Id is present in today meal booked data
        const isUserExists = response?.data.today.find(
          (item) => item.employeeId === emp_id,
        );
        //if user is not present in today meal booked data
        if (isUserExists?.isFeedback) {
          setIsFeedbackGiven(true);
        } else {
          setIsFeedbackGiven(false);
        }

        //Check if today's meal is booked
        if (isUserExists?.mealOn) {
          setIsTodayMealBooked(true);
        } else {
          setIsTodayMealBooked(false);
        }
        //Check if user is scanned or not
        if (isUserExists?.scanned) {
          setIsUserScanned(true);
        } else {
          setIsUserScanned(false);
        }
      }
      console.log("meal_verification_api_call_response", response);
    } catch (error) {
      console.log("Failed to fetch meal data", error);
    } finally {
      setFetchMealBookingLoader(false);
    }
  }

  //NOTE Dialog Visibility
  function feedbackFormVisibility() {
    const currentHours = new Date().getHours();
    //Dialog Visibility 1PM To 4PM
    if (currentHours >= 13 && currentHours <= 16) {
      console.log("Feedback_Dialog_Visibility");
      setVisible(true);
    }
  }

  useEffect(() => {
    feedbackFormVisibility();
    fetchMealBooking();
  }, []);

  //React Hooks Forms for submit feedback form
  const { control, handleSubmit } = useForm();

  //IMPORTANT Handel Feedback Form Submit
  async function handelFeedbackSubmit(ele) {
    //IF data not preset
    if (!ele.menuRating || !ele.foodQualityRating) {
      return showWarningMessage(
        toastRef,
        "Validation Error",
        "Please fill all required fields.",
      );
    }
    //Get Employee Id
    const emp_id = userDetails.userDetails.employeeId;
    //Check Employee Id is present in today meal booked data
    const isUserPresent = todayMealBooked.find(
      (item) => item.employeeId === emp_id,
    );

    //if user is not present in today meal booked data
    if (!isUserPresent) {
      return showWarningMessage(
        toastRef,
        "Validation Error",
        "You are not eligible to give feedback.",
      );
    }

    //Payload for feedback API
    const payLoad = [
      {
        date: isUserPresent?.date,
        userId: isUserPresent?.employeeId,
        time: isUserPresent.lunchType,
        mealOn: isUserPresent.mealOn,
        roti: isUserPresent.roti,
        extraMeal: isUserPresent.extraMeal,
        menu: isUserPresent.menu,
        scanned: isUserPresent.scanned,
        isFeedback: true,
        menuRating: ele.menuRating,
        foodQualityRating: ele.foodQualityRating,
      },
    ];

    //Feedback Form Update API call
    try {
      setLoader(true);
      const response = await updateMeal(payLoad, userDetails.token);
      if (response.status === 200) {
        return showSuccessMessage(
          toastRef,
          "Success",
          "Thank you for your feedback!",
        );
      }
    } catch (error) {
      console.log("Feedback from submit api error", error);
      return showWarningMessage(
        toastRef,
        "Error",
        "Failed to submit feedback. Please try again later.",
      );
    } finally {
      setLoader(false);
      setVisible(false);
    }
  }
  // console.log(
  //   "todayMealBooked___isFeedback",
  //   isFeedbackGiven,
  //   fetchMealBookingLoader,
    
  // );

  return (
    <>
      <Toast ref={toastRef} />
      {fetchMealBookingLoader && (
        <div className="flex justify-content-center align-items-center">
          <i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem" }}></i>
        </div>
      )}
      {!isFeedbackGiven && isTodayMealBooked && isUserScanned && !fetchMealBookingLoader && (
        <Dialog
          header="Today's Meal Feedback"
          visible={visible}
          style={{ width: "18rem" }}
          className="dialogHeader dialogContent"
          onHide={() => {
            if (!visible) return;
            setVisible(false);
          }}
        >
          <form
            onSubmit={handleSubmit(handelFeedbackSubmit)}
            style={{
              display: "grid",
              rowGap: "0.5rem",
              margin: "0 1rem",
              justifyItems: "center",
              alignItems: "center",
            }}
          >
            <>
              <label>Please Rate Today's Menu</label>
              <Controller
                name="menuRating"
                //rules={{ required: "Menu is required" }}
                control={control}
                render={({ field }) => {
                  return <Rating {...field} cancel={false} />;
                }}
              />
              <label>Food Taste Feedback</label>
              <Controller
                name="foodQualityRating"
                //rules={{ required: "Food quality is required" }}
                control={control}
                render={({ field }) => {
                  return <Rating {...field} cancel={false} />;
                }}
              />
              <Button
                variant="contained"
                className="mt-2"
                sx={{ boxShadow: "none" }}
                size="small"
                type="submit"
                loading={loader}
              >
                Save
              </Button>
            </>
          </form>
        </Dialog>
      )}
    </>
  );
}

export default MealFeedback;
