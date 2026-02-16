import { Button } from "@mui/material";
import { Dialog } from "primereact/dialog";
import { Rating } from "primereact/rating";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";

function MealFeedback() {
  const [visible, setVisible] = useState(false);

  //IMPORTANT Dialog Visibility
  function feedbackFormVisibility() {
    const currentHours = new Date().getHours();
    //Dialog Visibility 2PM To 5PM
    if (currentHours >= 14 && currentHours < 14) {
      console.log("Feedback_Dialog_Visibility");
      setVisible(true);
    }
  }
  useEffect(() => {
    feedbackFormVisibility();
  }, []);

  const { control, handleSubmit,formState:{errors} } = useForm();

  function handelFeedbackSubmit(ele) {
    console.log("ele", ele);
  }

  console.log("error",errors);

  return (
    <>
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
              rules={{required:"Menu is required"}}
              control={control}
              render={({ field }) => {
                return <Rating  {...field}  cancel={false}/>;
              }}
            />
            <label>Food Taste Feedback</label>
            <Controller
              name="foodQualityRating"
              rules={{required:"Food quality is required"}}
              control={control}
              render={({ field }) => {
                return <Rating {...field}  cancel={false}/>;
              }}
            />
            <Button
              variant="contained"
              className="mt-2"
              sx={{ boxShadow: "none", }}
              size="small"
              type="submit"
            >
              Save
            </Button>
          </>
        </form>
      </Dialog>
    </>
  );
}

export default MealFeedback;
