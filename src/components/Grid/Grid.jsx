import * as React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";

export default function BasicGrid({
  size,
  style,
  container,
  spacing,
  className,
  rowSpacing,
  columnSpacing,
  children,
}) {
  return (
    <>
      <Grid
        container={container}
        size={size}
        style={style}
        spacing={spacing}
        className={className}
        rowSpacing={rowSpacing}
        columnSpacing={columnSpacing}
      >
        {children}
      </Grid>
    </>
  );
}
