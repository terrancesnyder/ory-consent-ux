import * as React from "react";
import routes from "./routes";
import { Routes, Route } from "react-router-dom";

export default function App({ req, res }) {
  return (
    <Routes>
      {routes.map(({ path, component: C, key: key }) => (
        <Route
          exact
          strict
          key={key}
          path={path}
          element={<C req={req} res={res} />}
        />
      ))}
    </Routes>
  );
}
