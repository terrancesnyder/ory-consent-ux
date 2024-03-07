import {
  UiNode,
  ErrorAuthenticatorAssuranceLevelNotSatisfied,
} from "@ory/client";
import sdk from "./sdk";

export const removeTrailingSlash = (s) => s.replace(/\/$/, "");

export const getUrlForFlow = (base, flow, query) =>
  `${removeTrailingSlash(base)}/self-service/${flow}/browser${
    query ? `?${query.toString()}` : ""
  }`;

export const isUUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export const isQuerySet = (x) => typeof x === "string" && x.length > 0;

const isErrorAuthenticatorAssuranceLevel = (err) => {
  return (
    err && err.error && err.error.id && err.error.id === "session_aal2_required"
  );
};
