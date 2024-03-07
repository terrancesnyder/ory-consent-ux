#!/bin/bash -e
set -e -x

export PORT=7171

export APP_NAME=Consent

# The URL where identity information can be fetched
export KRATOS_PUBLIC_URL=https://secure.klustr.io/kratos
export KRATOS_ADMIN_URL=https://kratos-admin.klustr.io

# The URL where oauth information can be fetched
export HYDRA_URL=https://secure.klustr.io/hydra
export HYDRA_ADMIN_URL=https://hydra-admin.klustr.io

# The webhook that will be called when a user changes
# or updates their consent settings.
export WEBHOOK_URL=https://kong-gateway.klustr.io
export WEBHOOK_API_KEY=my_private_key

export CONSENT_SCOPE_ATTRIBUTES_URL="http://localhost:7777/consent/scopes"

# Enables X-Forwarded-Proto on headers sent to hydra
export MOCK_TLS_TERMINATION=y

# export TLS_CERT_PATH
# export TLS_KEY_PATH

npm start 

