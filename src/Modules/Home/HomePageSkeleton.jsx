import { Skeleton } from "primereact/skeleton";

import { Card } from "primereact/card";
import { Grid } from "@mui/material";

const HomePageSkeleton = () => {
  return (
    <>
      <div className="container mx-auto px-4">
        <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
          {/* ================= HEADER ================= */}
          <div className="cardStyle mt-4 mb-2 py-2.5 px-4 shadow rounded">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg">
                    <Skeleton shape="circle" size="2.5rem"></Skeleton>
                  </div>
                  <div>
                    <Skeleton width="5rem" height="1rem" />
                    <Skeleton width="12rem" height="0.5rem" className="mt-2" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Skeleton
                      width="40px"
                      height="1.2rem"
                      borderRadius="16px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Grid container spacing={2}>
            {/* ================= LEFT PANEL ================= */}
            <Grid size={{ xs: 12, md: 3 }}>
              {/* Profile */}
              <Card className="cardNew primReactCardBody BorderRadius cardStyle p-2">
                <div className="flex flex-col items-center gap-2 mt-2">
                  <Skeleton shape="circle" size="115px" />
                  <Skeleton width="50%" />
                  <Skeleton width="50%" />
                  <Skeleton width="70%" className="mt-1" />
                </div>

                <div className="mt-3 space-y-2 mx-4">
                  <Skeleton height="2rem" />
                  <Skeleton height="2rem" />
                </div>
              </Card>

              {/* Training */}
              <Card className="cardNew primReactCardBody primReactCardContentPadding BorderRadius cardStyle p-3 mt-2">
                <div className="flex items-center justify-between">
                  <Skeleton width="50%" />
                  <Skeleton width="3rem" />
                </div>

                <div className="flex items-center justify-between mt-4">
                  <Skeleton width="50%" />
                  <Skeleton width="3rem" />
                </div>
              </Card>

              {/* Claims */}
              <Card className="cardNew primReactCardBody primReactCardContentPadding BorderRadius cardStyle p-3 mt-2">
                <div className="flex items-center justify-between">
                  <Skeleton width="50%" />
                  <Skeleton width="3rem" />
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Skeleton width="40%" />
                  <Skeleton width="3rem" />
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Skeleton width="60%" />
                  <Skeleton width="3rem" />
                </div>
              </Card>
            </Grid>

            {/* ================= RIGHT PANEL ================= */}
            <Grid size={{ xs: 12, md: 9 }}>
              {/* Carousel */}
              <Card className="cardNew primReactCardBody primReactCardContentPadding BorderRadius cardStyle p-3">
                <Skeleton height="20.45rem" />
              </Card>

              <Grid container spacing={2} className="mt-1">
                {/* Claims / Leaves */}
                <Grid size={{ xs: 12, md: 5 }}>
                  <Card className="cardNew primReactCardBody primReactCardContentPadding BorderRadius cardStyle p-3">
                    <div className="flex items-center justify-between">
                      <Skeleton width="40%" />
                      <Skeleton width="3rem" />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Skeleton width="40%" />
                      <Skeleton width="3rem" />
                    </div>
                  </Card>

                  <Card className="cardNew primReactCardBody primReactCardContentPadding BorderRadius cardStyle p-3 mt-2">
                    <div className="flex items-center justify-between">
                      <Skeleton width="40%" />
                      <Skeleton width="3rem" />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Skeleton width="40%" />
                      <Skeleton width="3rem" />
                    </div>
                  </Card>

                  <Card className="cardNew primReactCardBody primReactCardContentPadding BorderRadius cardStyle p-3 mt-2">
                    <div className="flex items-center justify-between">
                      <Skeleton width="40%" />
                      <Skeleton width="3rem" />
                    </div>
                  </Card>
                </Grid>

                {/* Notifications */}
                <Grid size={{ xs: 12, md: 7 }}>
                  <Card className="cardNew primReactCardBody primReactCardContentPadding BorderRadius cardStyle p-3">
                    <Skeleton height="12.5rem" />
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </div>
      </div>
    </>
  );
};
export default HomePageSkeleton;
