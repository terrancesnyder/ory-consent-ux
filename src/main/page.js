import express from "express";
import * as React from "react";
import ReactDOM from "react-dom/server";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { CacheProvider } from "@emotion/react";
import createEmotionServer from "@emotion/server/create-instance";
import createEmotionCache from "./cache";
import App from "./app";
import theme from "./theme";
import { StaticRouter } from "react-router-dom/server";
import crypto from "crypto";
import csrf from "csurf";
import { da } from "date-fns/locale";

const APP_NAME = process.env.APP_NAME || "Consent";

function page(title, html, styles) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>${title}</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700&display=swap" rel="stylesheet">

        <link rel="icon" type="image/x-icon" href="/public/favicon.ico">
        
        <meta name="emotion-insertion-point" content="" />
        ${styles}
      </head>
      <body>
        <script async src="/build/bundle.js"></script>
        <div id="root">${html}</div>
      </body>
    </html>
  `;
}

function render(req, res, payload) {
  const staticContext = {};

  const cache = createEmotionCache();
  const { extractCriticalToChunks, constructStyleTagsFromChunks } =
    createEmotionServer(cache);

  // Render the component to a string.
  const html = ReactDOM.renderToString(
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <StaticRouter location={req.url}>
          <App user={req.user} req={req} res={res} />
        </StaticRouter>
      </ThemeProvider>
    </CacheProvider>
  );

  // Grab the CSS from emotion
  const emotionChunks = extractCriticalToChunks(html);
  const styles = constructStyleTagsFromChunks(emotionChunks);

  // Send the rendered page back to the client.
  res.status(staticContext.statusCode || 200);
  res.send(page(req.title || APP_NAME, html, styles));
  res.end();
}

export default render;
