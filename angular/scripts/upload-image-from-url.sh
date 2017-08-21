#!/bin/bash

AUTHENTICATOR_URL="https://your-runtime-domain.twil.io/authenticate?username=twilio&pincode=44444"
wget $1 -qO tmp.jpg
read token upload_url <<EOF
$(
    curl -s $AUTHENTICATOR_URL | \
    python -c 'import sys, json;o=json.load(sys.stdin);print o["token"], o["upload_url"]'
)
EOF

curl -s --request POST $upload_url --header "X-Twilio-Token: $token" --data-binary @tmp.jpg | \
    python -c 'import sys, json;o=json.load(sys.stdin);print "\"" + "https://mcs.us1.twilio.com" + o["url"] + "\""'

rm -f tmp.jpg
