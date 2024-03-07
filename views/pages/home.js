import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import DefaultLayout from "../layouts/default";

export default function HomePage() {
  React.useEffect(() => {}, []);

  return DefaultLayout(<h1>Hello home!</h1>);
}
