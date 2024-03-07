import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import DefaultLayout from "../layouts/default";
import { LoginFlow, UiNodeInputAttributes } from "@ory/client";
// import { URLSearchParams } from "url";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router";
import { useLocation } from "react-router-dom";
import { getUrlForFlow, isQuerySet } from "../../src/main/ory/utils";
import sdk from "../../src/main/ory/sdk";
import { getNodeId, isUiNodeInputAttributes } from "@ory/integrations/ui";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  LinearProgress,
  Link,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { handleFlowError } from "../../src/main/ory/errors";
import {
  ShimmerButton,
  ShimmerCircularImage,
  ShimmerSectionHeader,
  ShimmerText,
  ShimmerThumbnail,
  ShimmerTitle,
} from "react-shimmer-effects";

export default function LoginPage({ req, res }) {
  const navigate = useNavigate();
  const useQuery = () => new URLSearchParams(useLocation().search);
  const query = useQuery();

  const [flow, setFlow] = React.useState();
  const [client, setClient] = React.useState();
  const [loading, setLoading] = React.useState(true);

  const { shadows } = useTheme();

  // login, then logout
  // go to main page
  // try login with different user
  // bombs out

  const args = {
    flow: query.get("flow"),
    aal: query.get("aal") || "",
    refresh: query.get("refresh") || "",
    return_to: query.get("return_to") || "",
    login_challenge: query.get("login_challenge") || "",
  };

  const initFlowQuery = new URLSearchParams({
    aal: args.aal.toString(),
    refresh: args.refresh.toString(),
    return_to: args.return_to.toString(),
  });

  if (isQuerySet(args.login_challenge)) {
    initFlowQuery.append("login_challenge", args.login_challenge);
  }

  const initFlowUrl = getUrlForFlow(
    sdk.KRATOS_PUBLIC_URL,
    "login",
    initFlowQuery
  );

  const getLogoutUrl = async (loginFlow) => {
    let logoutUrl = "";
    try {
      logoutUrl = await sdk.frontend
        .createBrowserLogoutFlow({
          cookie: req.header("cookie"),
          returnTo:
            (return_to && return_to.toString()) || loginFlow.return_to || "",
        })
        .then(({ data }) => data.logout_url);
    } catch (err) {
      console.log("Unable to create logout URL", { error: err });
    } finally {
      return logoutUrl;
    }
  };

  React.useEffect(() => {
    setLoading(true);
    if (!isQuerySet(args.flow)) {
      window.location.href = initFlowUrl;
      return;
    }

    sdk.frontend
      .getLoginFlow({ id: args.flow })
      .then(async ({ data: flow }) => {
        setFlow(flow);
        var c = {
          client_id: flow.oauth2_login_request?.client?.client_id,
          client_name: flow.oauth2_login_request?.client?.client_name,
          client_uri: flow.oauth2_login_request?.client?.client_uri,
          logo_uri: flow.oauth2_login_request?.client?.logo_uri,
          policy_uri: flow.oauth2_login_request?.client?.policy_uri,
          tos_uri: flow.oauth2_login_request?.client?.tos_uri,
        };
        if (c.client_id) {
          setClient(c);
        }
        setLoading(false);
      })
      .catch(handleFlowError(navigate, "login", setFlow));
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    const formData = {};

    // Determine which submit button was clicked
    const submitButtonName = e.nativeEvent.submitter.name;

    // Traverse all child elements of the form target
    e.target.querySelectorAll("input").forEach((input) => {
      const { name, value } = input;
      formData[name] = value;
    });

    formData[e.nativeEvent.submitter.name] = e.nativeEvent.submitter.value;

    sdk.frontend
      .updateLoginFlow({
        flow: args.flow,
        updateLoginFlowBody: formData,
      })
      .then(() => {
        if (flow?.return_to) {
          window.location.href = flow?.return_to;
          return;
        }
      })
      .catch(handleFlowError(navigate, "login", setFlow))
      .catch((err) => {
        // If the previous handler did not catch the error it's most likely a form validation error
        if (err.response?.status === 400) {
          // Yup, it is!
          setFlow(err.response?.data);
          return;
        }

        return Promise.reject(err);
      });
  };

  function oidcNodes() {
    return flow.ui.nodes.filter((node) => node.group == "oidc");
  }

  function signinNodes() {
    return flow.ui.nodes.filter(
      (node) => node.group == "default" || node.group == "password"
    );
  }

  function inputType(node) {
    const key = getNodeId(node);

    if (node.attributes.type == "submit") {
      if (node.attributes.value == "password") {
        return (
          <Button
            key={key}
            type="submit"
            variant="contained"
            value={node.attributes.value}
            name={node.attributes.name}
            size="medium"
          >
            Sign In
          </Button>
        );
      }
      if (node.attributes.value == "google") {
        return (
          <Button
            key={key}
            type="submit"
            variant="outlined"
            value={node.attributes.value}
            name={node.attributes.name}
            startIcon={<img src="/public/google.svg" height={24} />}
          >
            {node.meta.label.text}
          </Button>
        );
      }
    }
    if (node.attributes.type == "password") {
      return (
        <FormControl variant="outlined" key={key}>
          <TextField
            type="password"
            name={node.attributes.name}
            autoComplete="current-password"
          />
          <FormHelperText id="outlined-weight-helper-text">
            Password
          </FormHelperText>
        </FormControl>
      );
    }
    if (node.attributes.type == "text") {
      return (
        <FormControl variant="outlined" key={key}>
          <TextField name={node.attributes.name} autoComplete="username" />
          <FormHelperText id="outlined-weight-helper-text">
            Username
          </FormHelperText>
        </FormControl>
      );
      // return <input type="text" alt= />;
    }
    if (node.attributes.type == "hidden") {
      return (
        <input
          type="hidden"
          name={node.attributes.name}
          value={node.attributes.value}
          key={key}
        />
      );
    }
    throw "Unknown type of node: " + JSON.stringify(node);
  }

  return DefaultLayout(
    <Box sx={{ width: "100%" }}>
      {loading && (
        <LinearProgress
          variant="indeterminate"
          color="inherit"
          sx={{ ...(loading == false && { display: "none" }) }}
        />
      )}
      <Grid
        container
        spacing={0}
        sx={{
          display: "flex",
          justify: { sm: "center" },
          direction: { sm: "column" },
          alignItems: { sm: "center" },
          justifyContent: { sm: "center" },
          minHeight: "99vh",
          backgroundColor: { sm: "#f9f9f9" },
        }}
      >
        <Container
          sx={{
            margin: { xs: "0px", sm: "0px" },
            padding: { xs: "0px", sm: "0px" },
          }}
        >
          <Card
            sx={{
              margin: { sm: "0px auto" },
              maxWidth: { sm: 450 },
              boxShadow: {
                xs: "none",
                sm: shadows[1],
              },
            }}
          >
            <CardContent sx={{ padding: 6 }}>
              {!flow && (
                <Grid container direction={"column"}>
                  <center>
                    <ShimmerCircularImage />
                    <ShimmerSectionHeader center subTitle={false} />
                    <ShimmerText line={2} gap={10} center />
                    <ShimmerThumbnail height={48} />
                    <ShimmerThumbnail height={48} />
                    <ShimmerThumbnail height={32} />
                    <ShimmerThumbnail height={32} />
                    <ShimmerText line={2} gap={10} />
                  </center>
                </Grid>
              )}
              {flow && (
                <Stack direction={"column"} gap={4}>
                  {client && (
                    <Grid
                      container
                      gap={1}
                      direction="column"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <img src={client.logo_uri} height={64} />
                      <Typography
                        variant="h3"
                        sx={{
                          textAlign: "center",
                          fontWeight: "100",
                          letterSpacing: -0.6,
                        }}
                      >
                        {client.client_name}
                      </Typography>

                      <Typography
                        variant="description"
                        sx={{ textAlign: "center" }}
                      >
                        In order to access {client.client_name} you need to sign
                        in to your account.
                      </Typography>
                    </Grid>
                  )}

                  {!client && (
                    <Grid
                      container
                      gap={1}
                      direction="column"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Typography
                        variant="h3"
                        sx={{
                          textAlign: "center",
                          fontWeight: "100",
                        }}
                      >
                        Sign in to continue
                      </Typography>
                      <Typography variant="body" sx={{ textAlign: "center" }}>
                        To proceed verify your identity.
                      </Typography>
                    </Grid>
                  )}

                  {flow?.ui?.messages != null && (
                    <Stack
                      direction={"column"}
                      gap={2}
                      sx={{ marginBottom: "1em" }}
                    >
                      {flow.ui.messages.map((node, k) => {
                        return (
                          <Alert key={node.id} severity={node.type}>
                            {node.text}
                          </Alert>
                        );
                      })}
                    </Stack>
                  )}

                  <form
                    id={flow.id}
                    action={flow.ui.action}
                    method={flow.ui.method}
                    onSubmit={onSubmit}
                  >
                    <Stack direction={"column"} gap={2}>
                      <Stack direction={"column"} gap={2}>
                        {signinNodes().map((node, k) => {
                          return inputType(node);
                        })}
                      </Stack>

                      <Stack direction={"column"} gap={4}>
                        {oidcNodes().map((node, k) => {
                          return inputType(node);
                        })}
                      </Stack>
                    </Stack>
                  </form>
                  <Typography variant="small">
                    By continuing you are expected to follow and adhere to the
                    terms and services and privacy policy.
                  </Typography>
                </Stack>
              )}
            </CardContent>
          </Card>
          <Grid
            container
            direction="row"
            justifyContent="flex-end"
            alignItems="flex-start"
            gap={3}
            sx={{
              margin: { sm: "0px auto" },
              maxWidth: { sm: 450 },
              padding: { xs: "0em 4em 0em 4em", sm: "0px" },
              mt: { sm: "1em" },
            }}
          >
            <Link href="#" underline="hover" variant="small">
              Help
            </Link>
            <Link href="#" underline="hover" variant="small">
              Privacy
            </Link>
            <Link href="#" underline="hover" variant="small">
              Terms
            </Link>
          </Grid>
        </Container>
      </Grid>
    </Box>
  );
}
