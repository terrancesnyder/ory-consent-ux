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
import render from "./page";
import * as fs from "fs";
import * as https from "https";

import cookieParser from "cookie-parser"; // CSRF Cookie parsing
import bodyParser from "body-parser"; // CSRF Body parsing
import csrf from "csurf";
import ConsentApi from "./apis/consent";
import session from "express-session";

const HTTP_PORT = process.env.HTTP_PORT || 7171;

const path = require("path");
const app = express();

app.use("/public", express.static("public"));
app.use("/build", express.static("build"));
app.use(express.static("build"));
app.use(cookieParser());
app.use(
  session({
    name: "test",
    secret: "test",
    cookie: { maxAge: 3 * 60 * 60 * 1000 },
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: { httpOnly: true, secure: true },
  })
);

// csrf
const csrfProtection = csrf({
  cookie: true,
});

// security apis
const router = express.Router();
app.use(csrfProtection);

// wire up consent app
new ConsentApi(app, csrfProtection);

// I turned this off...
app.get("*", csrfProtection, render);

const port = Number(process.env.PORT) || 7171;

let listener = (proto) => () => {
  console.log(`Listening on ${proto}://0.0.0.0:${port}`);
};

if (process.env.TLS_CERT_PATH?.length && process.env.TLS_KEY_PATH?.length) {
  const options = {
    cert: fs.readFileSync(process.env.TLS_CERT_PATH),
    key: fs.readFileSync(process.env.TLS_KEY_PATH),
  };

  https.createServer(options, app).listen(HTTP_PORT, listener("https"));
} else {
  app.listen(HTTP_PORT, listener("http"));
}
