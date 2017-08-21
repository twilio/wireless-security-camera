#!/bin/bash

read token upload_url <<EOF
$(
    curl -s 'https://dancing-owl-0257.twil.io/bootstrap?identity=DE52aafc4150bec425884f242f490484f1' | \
    python -c 'import sys, json;o=json.load(sys.stdin);print o["token"], o["upload_url"]'
)
EOF

curl --verbose --header "X-Twilio-Token: $token" $1
