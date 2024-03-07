import * as React from "react";
import LoginPage from "../../views/pages/login";
import HomePage from "../../views/pages/home";
import ConsentPage from "../../views/pages/consent";

const routes = [
  {
    path: "/login",
    component: LoginPage,
    key: "login",
  },
  {
    path: "/consent",
    component: ConsentPage,
    key: "consent",
  },

  {
    path: "/",
    component: HomePage,
    key: "Home",
  },
];

export default routes;
