module.exports = function() {
  var config;
  config = {
    "server_url": "http://xxxx.localtunnel.me",
    "sqlite3": "./config/db.sqlite",
    "twilio_credentials": {
      "account_sid": "xxxx",
      "auth_token": "xxxx"
    },
    "twilio_sms": {
      "number": "xxxxxxxxxxx"
    },
    "clarifai": {
      "client_id": "xxxx",
      "client_secret": "xxxx"
    }
  };
  return config;
}();
