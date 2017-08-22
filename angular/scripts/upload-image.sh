#!/bin/bash

# Simulated camera uploading script.
#
# How to use:
# 1. Export RUNTIME_DOMAIN,RUNTIME_CAMERA_ID, RUNTIME_CAMERA_TOKEN environment variables in shell
# 2. Run the script with the first parameter of a valid png or jpg image file.
#    cat photoes are recommended: https://github.com/maxogden/cats/tree/master/cat_photos
# 3. To trigger a alarm, touch the file at /tmp/wireless-security-camera-alarm.trigger
#
# Example loopy loopy command:
# $ while true;do for img in `ls ~/Pictures/cats/cat_photos/*.{png,jpg} | sort -R | head -n10`;do ./upload-image.sh $img;done;done
#

echo "Authenticate camera..."
read camera_token camera_sync_instance camera_upload_url camera_snapshot_document <<eof
$(
#  {
#     "camera_id": "GUGABUGA",
#     "links": {
#         "upload_url": "https://mcs.us1.twilio.com/v1/Services/ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Media"
#     },
#     "service_sid": "ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
#     "success": true,
#     "sync_objects": {
#         "camera_alerts_list": "cameras.GUGABUGA.alerts",
#         "camera_archives_list_prefix": "cameras.GUGABUGA.archives.",
#         "camera_control_map": "cameras.GUGABUGA.control",
#         "camera_snapshot_document": "cameras.GUGABUGA.snapshot"
#     },
#     "token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxx_xxxxxxxxxxxxxxxxx",
#     "ttl": "3600"
# }
    curl -s "https://${RUNTIME_DOMAIN}/cameraauthenticate?camera_id=${RUNTIME_CAMERA_ID}&camera_token=${RUNTIME_CAMERA_TOKEN}"  | \
        python -c 'import sys, json;o=json.load(sys.stdin);print o["token"], o["service_sid"], o["links"]["upload_url"], o["sync_objects"]["camera_snapshot_document"]'
)
eof
test $? -eq 0 && echo "Camera authenticated." || exit -1

while (( "$#" ));do

IMAGE_SIZE=640x480
ALARM_TRIGGER_FILE=/tmp/wireless-security-camera-alarm.trigger
TMP_IMG_FILE=/tmp/wireless-security-camera-scaled.jpg
echo "Scaling image $1 to $IMAGE_SIZE..."
convert "$1" -resize $IMAGE_SIZE -background black -gravity center -extent $IMAGE_SIZE "$TMP_IMG_FILE"
echo "Scaling done."

echo "Uploading image to MCS..."
read mcs_content_url <<eof
$(
# {
#     "author": "GUGABUGA",
#     "channel_sid": null,
#     "content_type": "application/x-www-form-urlencoded",
#     "date_created": "2017-08-22T01:44:32.534-07:00",
#     "date_updated": "2017-08-22T01:44:32.534-07:00",
#     "filename": null,
#     "links": {
#         "content": "https://mcs.us1.twilio.com/v1/Services/ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Media/MExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Content"
#     },
#     "message_sid": null,
#     "service_sid": "ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
#     "sid": "MExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
#     "size": 78056,
#     "url": "https://mcs.us1.twilio.com/v1/Services/ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Media/MExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
# }
    curl -s --request POST $camera_upload_url --header "X-Twilio-Token: $camera_token" --data-binary @$TMP_IMG_FILE | \
        python -c 'import sys, json;o=json.load(sys.stdin); print o["url"]'
)
eof
test $? -eq 0 && echo "Image uploaded to '$mcs_content_url'." || exit -1

alarm_triggered=false
if [ -f $ALARM_TRIGGER_FILE ];then
    echo "!!! Alarm triggered !!!"
    alarm_triggered=true
    rm -f $ALARM_TRIGGER_FILE
fi

echo "Update camera '$RUNTIME_CAMERA_ID' snapshot..."
node <<eof
const syncIdentity = 'wireless-security-camera-local-${RUNTIME_CAMERA_ID}';
const SyncClient = require('twilio-sync');
const syncClient = new SyncClient("$camera_token");
syncClient.document("$camera_snapshot_document").then(doc => {
    doc.set({
        mcs_url : "$mcs_content_url",
        traits: {
            changes_detected: $alarm_triggered,
        }
    }).then(function () {
        process.exit(0);
    });    
});
eof
test $? -eq 0 && echo "Camera '$RUNTIME_CAMERA_ID' snapshot updated." || exit -1

shift
done
