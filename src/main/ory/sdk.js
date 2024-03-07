import { Configuration, FrontendApi } from "@ory/client";

const KRATOS_PUBLIC_URL = "https://secure.klustr.io/kratos";
const hydraHttpHeaderOptions = {};
hydraHttpHeaderOptions.headers = { "X-Forwarded-Proto": "https" };

// Sets up the SDK
const sdk = {
  KRATOS_PUBLIC_URL: KRATOS_PUBLIC_URL,
  frontend: new FrontendApi(
    new Configuration({
      basePath: KRATOS_PUBLIC_URL,
    })
  ),
};

export default sdk;
