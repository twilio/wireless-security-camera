const crypto = require("crypto");
const AccessToken = Twilio.jwt.AccessToken;
const SyncGrant = AccessToken.SyncGrant;

function cameraAuth(cameras, camera_id, camera_token) {
  if (!(camera_id in cameras)) return false;
  let hash = crypto.createHash('sha512').update(camera_token).digest("hex");
  return hash === cameras[camera_id].hash;
}

exports.handler = function(context, event, callback) {
  let camera_id = event.camera_id;
  let camera_token = event.camera_token;

  if (!camera_id) return callback(null, { success: false, error: "camera_id is not defined in event" });
  if (!camera_token) return callback(null, { success: false, error: "camera_token is not defined in event" });

  // Create a "grant" which enables a client to use Sync as a given user,
  // on a given device
  let syncGrant = new SyncGrant({
    serviceSid: context.SERVICE_SID
  });

  // Create an access token which we will sign and return to the client,
  // containing the grant we just created
  let token = new AccessToken(
    context.ACCOUNT_SID,
    context.API_KEY,
    context.API_SECRET, {
      ttl : parseInt(context.TOKEN_TTL) // int and string are different for AccessToken
    }
  );
  token.addGrant(syncGrant);
  token.identity = camera_id;

  // verify camera token
  let client = Twilio(context.API_KEY, context.API_SECRET, { accountSid : context.ACCOUNT_SID } );
  let syncService = client.sync.services(context.SERVICE_SID);
  syncService.documents("app.configuration").fetch()
  .then(function (configDocument) {

    let config = configDocument.data;
    if (cameraAuth(config.cameras, camera_id, camera_token)) {
      // Serialize the token to a JWT string and include it in a JSON response
      callback(null, {
        success: true,
        camera_id: camera_id,
        service_sid: context.SERVICE_SID,
        ttl: context.TOKEN_TTL,
        token: token.toJwt(),
        links: {
          upload_url: "https://mcs.us1.twilio.com/v1/Services/" + context.SERVICE_SID + "/Media"
        },
        sync_objects: {
          camera_snapshot_document: "cameras." + camera_id + ".snapshot",
          camera_control_document: "cameras." + camera_id + ".control"
        }
      });
    } else {
      callback(null, { success: false, error: "Unauthorized camera: " + camera_id });
    }
  })
  .catch(function (error) {
    callback(null, { success: false, error: "Sync service error: " + error });
  });
};
