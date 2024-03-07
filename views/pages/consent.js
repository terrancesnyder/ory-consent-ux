import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import DefaultLayout from "../layouts/default";
import sdk from "../../src/main/ory/sdk";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router";
import { useLocation } from "react-router-dom";
import axios from "axios";
import cookie from "react-cookies";

import {
  Alert,
  Avatar,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { handleFlowError, handleGetFlowError } from "../../src/main/ory/errors";
import { CheckBox } from "@mui/icons-material";

export default function ConsentPage({ req, res }) {
  const navigate = useNavigate();
  const useQuery = () => new URLSearchParams(useLocation().search);
  const query = useQuery();

  const [flow, setFlow] = React.useState();
  const [client, setClient] = React.useState();
  const [scopes, setScopes] = React.useState([]);
  const [userId, setUserId] = React.useState();
  const [identity, setIdentity] = React.useState();
  const [returnUrl, setReturnUrl] = React.useState();
  const [loading, setLoading] = React.useState(true);

  const { shadows } = useTheme();

  const args = {
    consentChallenge: query.get("consent_challenge"),
  };

  /**
   * Performs an aggressive logout of the current user
   * where their hydra session and kratos sessions are eliminated.
   */
  const doLogout = async () => {
    axios
      .post("/api/logout", {
        return_to: returnUrl,
        challenge: args.consentChallenge,
        subject: userId,
      })
      .then(({ data: body }) => {
        window.location.href = returnUrl;
      });
  };

  /**
   * Handle the submit of the consent flow and forward to backend API.
   * @param {*} e  The event that generated this submit.
   */
  const onSubmit = async (e) => {
    e.preventDefault();
    let scopes = [];
    const submitButtonName = e.nativeEvent.submitter.name;
    if (submitButtonName == "allow") {
      e.target.querySelectorAll("input").forEach((input) => {
        const { name, value, checked } = input;
        if (name == "scope" && checked) {
          scopes.push(value);
        }
      });
      axios
        .post("/api/consent/" + args.consentChallenge, { scopes: scopes })
        .then(({ data: body }) => {
          window.location.href = body.redirect_to;
        });
    } else if (submitButtonName == "reject") {
      axios
        .delete("/api/consent/" + args.consentChallenge)
        .then(({ data: body }) => {
          window.location.href = body.redirect_to;
        });
    }
  };

  /**
   * Load the consent and challenge request.
   */
  React.useEffect(() => {
    var load = async function () {
      setLoading(true);
      var token = cookie.load("_csrf");
      axios.defaults.headers.common["csrf-token"] = token;
      axios.defaults.headers.common["x-csrf-token"] = token;

      axios
        .get("/api/consent/" + args.consentChallenge)
        .then(({ data: body }) => {
          setFlow(body);
          console.log(body.client, "client");
          setClient(body.client);
          setScopes(body.scopes);
          setUserId(body.subject);
          setIdentity(body.identity);
          setReturnUrl(body.return_url);
          setLoading(false);
        })
        .catch(handleGetFlowError("/login", "login", setFlow));
    };
    load();
  }, []);

  return DefaultLayout(
    <Grid
      container
      spacing={0}
      sx={{
        display: "flex",
        justify: { sm: "center" },
        direction: { sm: "column" },
        alignItems: { sm: "center" },
        justifyContent: { sm: "center" },
        minHeight: "100vh",
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
          <LinearProgress
            variant="indeterminate"
            color="inherit"
            sx={{ ...(loading == false && { display: "none" }) }}
          />
          {loading == false && (
            <CardContent sx={{ padding: 6 }}>
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
                    <Typography variant="body" sx={{ textAlign: "center" }}>
                      {client.client_name} would like to access your basic
                      information in order to sign-in.
                    </Typography>
                  </Grid>
                )}

                {client?.metadata?.verified != "verified" && (
                  <Alert
                    severity="error"
                    sx={{
                      borderBottomLeftRadius: "0px",
                      borderBottomRightRadius: "0px",
                    }}
                  >
                    This client has not been validated or verified yet. Please
                    be careful when making a decision to share this information
                    with this app.
                  </Alert>
                )}

                <form onSubmit={onSubmit} method="POST">
                  <Stack
                    direction={"column"}
                    gap={2}
                    sx={{ margin: "0px auto" }}
                  >
                    {identity?.metadata_public?.picture && (
                      <Stack gap={2}>
                        <Grid
                          container
                          direction="row"
                          justifyContent="space-between"
                          alignItems="stretch"
                        >
                          <Stack
                            direction={"row"}
                            gap={2}
                            sx={{
                              alignContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Avatar src={identity.metadata_public.picture} />
                            <Stack gap={0}>
                              <Typography variant="body">
                                {identity.traits?.name?.given_name}{" "}
                                {identity.traits?.name?.family_name}
                              </Typography>
                              <Typography variant="small">
                                {identity.traits.email}
                              </Typography>
                            </Stack>
                          </Stack>
                          <Button variant="text" onClick={doLogout}>
                            Logout
                          </Button>
                        </Grid>
                        <Divider />
                      </Stack>
                    )}
                    {scopes.map((obj, index) => {
                      return (
                        <FormControl key={obj.scope}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                value={obj.scope}
                                name="scope"
                                defaultChecked
                              />
                            }
                            label={
                              <Stack
                                direction={"column"}
                                gap="2"
                                sx={{
                                  alignContent: "center",
                                  alignItems: "start",
                                }}
                              >
                                <Typography>
                                  {obj.attributes.name.en}
                                </Typography>
                                <Typography variant="small">
                                  {obj.attributes.description.en}
                                </Typography>
                              </Stack>
                            }
                          />
                        </FormControl>
                      );
                    })}
                  </Stack>

                  <Grid
                    container
                    direction="row"
                    justifyContent="space-between"
                    alignItems="stretch"
                    sx={{ mt: 4 }}
                  >
                    <Button variant="text" type="submit" name="reject">
                      Cancel
                    </Button>
                    <Button variant="contained" type="submit" name="allow">
                      Allow
                    </Button>
                  </Grid>
                </form>

                {client && (
                  <Typography variant="small">
                    To continue, your name, email address, language preferences,
                    and profile picture will be shared with {client.client_name}
                    . Before using this app, you can review {client.client_name}
                    's{" "}
                    <a href={client.policy_uri} target="_blank">
                      privacy policy
                    </a>{" "}
                    and{" "}
                    <a href={client.tos_uri} target="_blank">
                      terms of service
                    </a>
                    .
                  </Typography>
                )}
              </Stack>
            </CardContent>
          )}
        </Card>
      </Container>
    </Grid>
  );
}
