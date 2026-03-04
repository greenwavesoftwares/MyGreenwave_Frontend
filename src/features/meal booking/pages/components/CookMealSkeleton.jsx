import { Skeleton } from "primereact/skeleton";
import React from "react";

function CookMealSkeleton() {
  return (
    <div className="w-full md:w-10/12 lg:w-10/12 mx-auto">
      {/* Header Card Skeleton */}

      {/* Tab Section Skeleton */}
      <div className="cardStyle mt-2 py-3 px-4 bg-white shadow rounded">
        <div className="flex gap-5 mb-3">
          <Skeleton width="100px" height="20px" />
          <Skeleton width="100px" height="20px" />
        </div>

        {/* Table Skeleton Rows */}
        <div className="flex flex-column gap-3">
          <Skeleton height="20px" />
          <Skeleton height="20px" />
          <Skeleton height="20px" />
          <Skeleton height="20px" />
          <Skeleton height="20px" />
          <Skeleton height="20px" />
          <Skeleton height="20px" />
          <Skeleton height="20px" />
        </div>
      </div>
    </div>
  );
}

export default CookMealSkeleton;
