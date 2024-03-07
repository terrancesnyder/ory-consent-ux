import { Configuration, IdentityApi, OAuth2Api } from "@ory/client";

const HYDRA_ADMIN_URL = process.env.HYDRA_ADMIN_URL;
const KRATOS_ADMIN_URL = process.env.KRATOS_ADMIN_URL;

const hydraHttpHeaderOptions = {};
hydraHttpHeaderOptions.headers = { "X-Forwarded-Proto": "https" };

// Sets up the SDK
const adminSdk = {
  oauth2: new OAuth2Api(
    new Configuration({
      basePath: HYDRA_ADMIN_URL,
      baseOptions: hydraHttpHeaderOptions,
    })
  ),
  identity: new IdentityApi(
    new Configuration({
      basePath: KRATOS_ADMIN_URL,
    })
  ),
};

export default adminSdk;
