import express from "express";
import * as fs from "fs";
import * as https from "https";
import axios from "axios";

import { useNavigate } from "react-router-dom";
import { useParams } from "react-router";
import { useLocation } from "react-router-dom";

import cookieParser from "cookie-parser"; // CSRF Cookie parsing
import bodyParser from "body-parser"; // CSRF Body parsing
import csrf from "csurf";
import adminSdk from "../ory/admin";
import sdk from "../ory/sdk";

/**
 * Handles the API from the front end and obfuscates and hides
 * the actual internal calls to admin services like hydra and kratos.
 *
 * @param {*} app The express app to bind
 */
export default function ConsentApi(app, csrfProtection) {
  // need to be able to use json requests
  app.use(express.json());

  /**
   * Consent attributes for displaying more metadata
   * and descriptions of scopes for labels, text, categories, etc.
   */
  var _scopeDefinitions = {};
  axios
    .get(process.env.CONSENT_SCOPE_ATTRIBUTES_URL)
    .then(({ data: body }) => {
      _scopeDefinitions = body;
    })
    .catch(function (error) {
      console.log(
        "Could not get consent attributes from " +
          process.env.CONSENT_SCOPE_ATTRIBUTES_URL
      );
    });

  const webhook = async (subject, scopes, session, challenge) => {
    const hook = axios.create({
      baseURL: "https://kong-gateway.klustr.io",
      headers: { apikey: "my_private_key" },
    });

    var audit = {
      subject: subject,
      approved_scopes: scopes,
      session: session,
      request: challenge,
    };

    console.log(JSON.stringify(audit), "request");

    hook
      .post("/consent/audit/ory", audit)
      .then(() => {
        console.log("Updated consent history.");
      })
      .catch(() => {
        console.log("Failed to update consent history.");
      });
  };

  /**
   * Gets the ID token and Access Token that will be associated
   * to the OIDC flow and be given back to the OIDC client based
   * on the approved scopes.
   *
   * @param {*} subject  The subject ID (user ID) approving scopes
   * @param {*} scopes The array of scopes ['profile','offline', 'email', 'phone']
   * @returns Promise which returns the session scopes.
   */
  const token = async (subject, scopes) => {
    let access_token = {};
    let id_token = {};

    // fetch and load the identity information from kratos
    // note this is a admin level call and should not be exposed directly
    // and should be protected
    let identity = (await adminSdk.identity.getIdentity({ id: subject })).data;

    if (scopes.includes("profile")) {
      access_token.given_name = id_token.given_name =
        identity.traits?.name?.given_name;
      access_token.family_name = id_token.family_name =
        identity.traits?.name?.family_name;
      access_token.nickname = id_token.nickname =
        identity.traits?.name?.nickname;
      access_token.email = id_token.email = identity.traits?.email;

      access_token.picture = id_token.picture =
        identity?.metadata_public?.picture;
      access_token.locale = id_token.locale = identity?.metadata_public?.locale;
    }

    // TODO enrichment to add groups and other metadata
    // https://www.ory.sh/docs/hydra/guides/claims-at-refresh

    return {
      // This data will be available when introspecting the token. Try to avoid sensitive information here,
      // unless you limit who can introspect tokens.
      access_token,

      // This data will be available in the ID token.
      id_token,
    };
  };

  /**
   * Logout from the kratos and hydra instances.
   */
  app.post("/api/logout", csrfProtection, async (req, res) => {
    adminSdk.oauth2
      .revokeOAuth2LoginSessions({
        subject: req.body.subject,
      })
      .then(({ data: body }) => {
        adminSdk.identity
          .deleteIdentitySessions({
            id: req.body.subject,
          })
          .then(({ data: kratos }) => {
            res.status(200).send(kratos);
          })
          .catch((err) => {
            console.error("Unable to logout.");
            res.status(500).send();
          });
      })
      .catch((err) => {
        console.error("Unable to logout.");
        res.status(500).send();
      });
  });

  /**
   * Will reject the consent request by the user.
   */
  app.delete("/api/consent/:challengeId", csrfProtection, async (req, res) => {
    const challengeId = req.params.challengeId;

    adminSdk.oauth2
      .rejectOAuth2ConsentRequest({
        consentChallenge: challengeId,
        rejectOAuth2Request: {
          error: "access_denied",
          error_description: "The resource owner denied the request",
        },
      })
      .then(({ data: body }) => {
        res.status(200).send(body);
      })
      .catch((err) => {
        console.error("Unable to reject consent.");
        res.status(500).send();
      });
  });

  /**
   * Updates and grants the consent scopes the user has provided while
   * populating the ID Token and Access Token.
   *
   * Assumes the request body:
   * ```
   * {
   *    "scopes": ["profile", "email", "id"]
   * }
   * ```
   */
  app.post("/api/consent/:challengeId", csrfProtection, async (req, res) => {
    const challengeId = req.params.challengeId;

    req.body.scopes = req.body.scopes || [];

    adminSdk.oauth2
      .getOAuth2ConsentRequest({
        consentChallenge: challengeId,
      })
      .then(({ data: consent }) => {
        token(consent.subject, req.body.scopes).then((session) => {
          adminSdk.oauth2
            .acceptOAuth2ConsentRequest({
              consentChallenge: challengeId,
              acceptOAuth2ConsentRequest: {
                // We can grant all scopes that have been requested - hydra already checked for us that no additional scopes
                // are requested accidentally.
                grant_scope: req.body.scopes,

                // ORY Hydra checks if requested audiences are allowed by the client, so we can simply echo this.
                grant_access_token_audience:
                  consent.requested_access_token_audience,

                // The session allows us to set session data for id and access tokens
                session,
              },
            })
            .then(({ data: body }) => {
              webhook(consent.subject, req.body.scopes, session, consent);
              res.status(200).send(body);
            })
            .catch((err) => {
              console.error("Unable to approve consent.");
              res.status(500).send();
            });
        });
      })
      .catch((err) => {
        console.log(err);
        console.error("Unable to get existing consent.");
        res.status(500).send();
      });
  });

  /**
   * Returns the current consent information request and challenge
   * and returns the data for presenting to the user.
   *
   * This requires getting the original consent request, also
   * grabbing the persons information for display, and then
   * finally joining this with descriptive and labels for consent
   * metadata.
   */
  app.get("/api/consent/:challengeId", csrfProtection, async (req, res) => {
    const challengeId = req.params.challengeId;

    adminSdk.oauth2
      .getOAuth2ConsentRequest({
        consentChallenge: challengeId,
      })
      .then(({ data: body }) => {
        const oidcParams = new URL(body.request_url).search;
        const oidcRequestParams = () => new URLSearchParams(oidcParams);
        const oidcQuery = oidcRequestParams();
        const returnUrl = oidcQuery.get("redirect_uri");

        // consent scopes
        let scopes = body.requested_scope.map((scope) => {
          let matches = _scopeDefinitions.filter((item) => {
            return item.id == scope;
          });
          let meta = {};
          meta.scope = scope;
          if (matches.length > 0) {
            meta.attributes = {
              name: matches[0].name,
              description: matches[0].description,
              namespace: matches[0].namespace,
              category: matches[0].category,
            };
          }
          return meta;
        });

        adminSdk.identity
          .getIdentity({ id: body.subject })
          .then((id) => {
            // clean up and make sure we dont spill
            // to many details about the oauth call
            res.status(200).json({
              requested_scope: body.requested_scope,
              challenge: body.challenge,
              skip: body.skip,
              subject: body.subject,
              scopes: scopes,
              client: {
                client_name: body.client.client_name,
                policy_uri: body.client.policy_uri,
                tos_uri: body.client.tos_uri,
                client_uri: body.client.client_uri,
                logo_uri: body.client.logo_uri,
                metadata: body.client.metadata,
              },
              request_url: body.request_url,
              login_challenge: body.login_challenge,
              login_session_id: body.login_session_id,
              return_url: new URL(returnUrl).origin,
              identity: {
                id: id.data.id,
                traits: {
                  email: id.data.traits.email,
                  name: id.data.traits.name,
                },
                metadata_public: id.data.metadata_public,
              },
            });
          })
          .catch((err) => {
            console.error("Unable to get identity.");
            res.status(500).send();
          });
      })
      .catch((err) => {
        console.log(err);
        console.error("Unable to get existing consent.");
        res.status(500).send();
      });
  });
}
