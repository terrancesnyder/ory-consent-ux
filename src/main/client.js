import * as React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { CacheProvider } from "@emotion/react";
import { hydrateRoot } from "react-dom/client";
import App from "./app";
import theme from "./theme";
import createEmotionCache from "./cache";

import { BrowserRouter, BrowserRouter as Router } from "react-router-dom";

const cache = createEmotionCache();

function Main() {
  return (
    <BrowserRouter>
      <CacheProvider value={cache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </CacheProvider>
    </BrowserRouter>
  );
}

const rootElement = document.getElementById("root");

hydrateRoot(rootElement, <Main />);
