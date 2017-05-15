var express         = require('express');
var bodyParser      = require('body-parser');
var session         = require('express-session');
var partials        = require('express-partials');
var favicon         = require('serve-favicon');
var path            = require('path');
var http            = require('http');
var winston         = require('winston');
var sassMiddleware  = require('node-sass-middleware');
var bourbon         = require('node-bourbon');
var fs              = require('fs');
var sqlite3         = require('sqlite3').verbose();
var moment          = require('moment');
var hat             = require('hat');
var twilioLibrary   = require('twilio');
var async           = require('async');
var request         = require('request');
var Clarifai        = require('clarifai');
var events          = require('events');
var event           = new events.EventEmitter();

// = Winston Setup =
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {level: 'debug', colorize: true});
winston.addColors({ info: 'blue', error: 'red' });

// = Errors =
process.on('uncaughtException', function (err) {
  winston.error('Uncaught Error:', err);
  process.exit();
});

// = config =
var config = require('./config/config');

// = Twilio =
var twilio = new twilioLibrary.Twilio(config.twilio_credentials.account_sid, config.twilio_credentials.auth_token);

// = DB connect
var db_exists = fs.existsSync(config.sqlite3);
if(!db_exists) {
  console.log("Creating DB file.");
  fs.openSync(config.sqlite3, "w");
}
var db = new sqlite3.Database(config.sqlite3);
if(!db_exists) {
  db.serialize(function() {
    db.run("CREATE TABLE cameras (id INTEGER primary key autoincrement, name TEXT, contact_number TEXT, twilio_sid TEXT, token TEXT, created_at TIMESTAMP)");
    db.run("CREATE TABLE photo_data (id integer primary key autoincrement, camera_id INTEGER, image_name TEXT, people_detected INTEGER, created_at TIMESTAMP, FOREIGN KEY(camera_id) REFERENCES cameras(id))");
  });
}

// = Express =
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/public/imgs/favicon.ico'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(partials());
app.use(require('express-session')({
  secret: '7jQ2EAyHKgTELxrp',
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));
app.use(
  sassMiddleware({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public'),
    outputStyle: 'nested',
    imagePath: path.join(__dirname, 'public', 'images'),
    includePaths: bourbon.with(path.join(__dirname, 'public', 'cssf'))
  })
);
app.use(express.static(path.join(__dirname, 'public')));

var server = http.createServer(app).listen(process.env.PORT || 8080, function () {
  winston.info('Web | Ready | Port:', server.address().port);
});

// = Routes =
app.get('/', function(req, res) {
  db.all("Select * from cameras",  function (error, rows) {
    if (error || typeof rows == 'undefined' || rows.length <= 0) {
      winston.error(error);
      res.render('index', { cameras: [] });
    } else {
      var cameras = rows;
      var db_calls = [];
      for(var i=0; i<cameras.length; i++) {
        var camera = cameras[0];
        var call = function(callback) {
          db.get("Select * from photo_data where camera_id = ? AND datetime(created_at) > ( datetime('now', '-5 minutes') ) order by created_at DESC", [camera.id],  function (error, row) {
            if (error) {
              winston.error(error);
              callback("chart_data error");
            } else {
              if(typeof row == 'undefined') {
                callback(null, null);
              } else {
                row.created_at = moment(row.created_at).fromNow();
                callback(null, { info: camera, motion: row });
              }
            }
          });
        }
      }
      db_calls.push(call);
    }
    async.parallel(db_calls,
      function(err, results) {
        if(err) {
          winston.error(err);
          res.render('index', { cameras: [] });
        } else {
          for(var i=0; i<results.length; i++) {
            if(results[i] == null) {
              results.splice(i, 1);
            }
          }
          res.render('index', { cameras: results });
        }
      });
  });
});

app.get('/cameras', function(req, res) {
  db.all("Select * from cameras",  function (error, rows) {
    if (error || typeof rows == 'undefined') {
      winston.error(error);
      res.render('camera_list', { cameras: [], error: "database error", page: "list" });
    } else {
      res.render('camera_list', { cameras: rows, moment: moment, page: "list" });
    }
  });
});

app.get('/camera/:id', function(req, res) {
  var id = req.params.id
  db.get("Select * from cameras where id=?", [id],  function (error, row) {
    if (error || typeof row == 'undefined') {
      winston.error(error);
      res.redirect('/');
    } else {
      var camera = row;
      db.all("Select * from photo_data where camera_id = ? AND people_detected>0 order by created_at DESC LIMIT 6", [camera.id],  function (error, rows) {
        if (error || typeof rows == 'undefined') {
          winston.error(error);
          res.redirect('/')
        } else {
          row.created_at = moment(row.created_at).fromNow();
          res.render('camera', { camera: camera, photos: rows, moment: moment });
        }
      });
    }
  });
});

app.post('/add-camera', function(req, res) {
  var name = req.body.name.replace(/'/g, "\\'");
  var contact_number = req.body.contact_number;
  var twilio_sid = req.body.twilio_sid;
  var token = hat();
  // check twilio for SIM SID correctness
  twilio.preview.wireless.sims(twilio_sid).fetch(function(err, device) {
    if(err) {
      winston.error(err);
      res.redirect('/cameras');
    } else {
      db.run("INSERT INTO cameras (name, contact_number, twilio_sid, token, created_at) VALUES (?, ?, ?, ?, ?)", [name, contact_number, twilio_sid, token, moment().utc().format()],  function (error) {
        if (error) {
          winston.error(error);
          res.render('camera_list', { devices: [], error: "database error", page: "list" });
        } else {
          // change twilio alias to SIM name
          twilio.preview.wireless.sims(twilio_sid).update({
            "alias": name
          }, function(err, device) {});
          res.redirect('/cameras');
        }
      });
    }
  });
});

app.post('/add-camera', function(req, res) {
  var name = req.body.name.replace(/'/g, "\\'");
  var contact_number = req.body.contact_number;
  var twilio_sid = req.body.twilio_sid;
  var token = hat();
  // check twilio for SIM SID correctness
  twilio.preview.wireless.sims(twilio_sid).fetch(function(err, device) {
    if(err) {
      winston.error(err);
      res.redirect('/cameras');
    } else {
      db.run("INSERT INTO cameras (name, contact_number, twilio_sid, token, created_at) VALUES (?, ?, ?, ?, ?)", [name, contact_number, twilio_sid, token, moment().utc().format()],  function (error) {
        if (error) {
          winston.error(error);
          res.render('camera_list', { devices: [], error: "database error", page: "list" });
        } else {
          // change twilio alias to SIM name
          twilio.preview.wireless.sims(twilio_sid).update({
            "alias": name
          }, function(err, device) {});
          res.redirect('/cameras');
        }
      });
    }
  });
});

app.post('/camera/:id/edit', function(req, res) {
  var id = req.params.id
  var name = req.body.name.replace(/'/g, "\\'");
  var contact_number = req.body.contact_number;
  var twilio_sid = req.body.twilio_sid;
  var token = req.body.token;
  db.run("UPDATE cameras SET name=?, contact_number=?, twilio_sid=?, token=? WHERE id=?", [name, contact_number, twilio_sid, token, id],  function (error) {
    if (error) {
      winston.error(error);
      res.render('camera_list', { devices: [], error: "database error", page: "list" });
    } else {
      // change twilio alias to SIM name
      twilio.preview.wireless.sims(twilio_sid).update({
        "alias": name
      }, function(err, device) {});
      res.redirect('/cameras');
    }
  });
});

// token per device
function checkToken(req, res, next) {
  var camera_id = req.body.id;
  var request_token = req.body.token;

  db.get("Select * from cameras where id = ? limit 1", [camera_id],  function (error, row) {
    if(row && (row.token == request_token)) {
      next();
    } else {
      winston.debug("permission denied");
      res.json({ "success": false, "error": "permission denied" });
    }
  });
}

// 404 Catch-all
app.use(function (req, res, next) {
  res.status(404);
  winston.error('Page not found:', req.url);
  res.redirect('/');
});

// = App Socket =
var io = require('socket.io')({
  'port': server.address().port,
  'heartbeat interval': 2000,
  'heartbeat timeout' : 3000
});

io.listen(server);
io.on('connection', function(socket) {
  socket.on('new-image', function(data) {
    data = JSON.parse(data);
    newImage(data.id, data.name, data.image);
  });
});

var app_socket = io.of('/client');
app_socket.on('connection', function(socket) {
  winston.info("=== SERVER ===", "SITE CONNECTED");

  socket.on('disconnect', function(){
    winston.info("=== SERVER ===", "SITE DISCONNECTED");
  });
});

var image_counter = 0;
var motion_detected = false;
var last_image_motion = false;
var no_person = false;
var clarifai = new Clarifai.App(
  config.clarifai.client_id,
  config.clarifai.client_secret
);
function newImage(camera_id, name, image_b64) {
  app_socket.emit('new:photo', { id: camera_id, name: name, image: image_b64, motion_detected: motion_detected  });
  // every 15 images send to clarifai (~ 1 a minute)
  image_counter++;
  winston.debug("New image: "+image_counter);
  if(image_counter >= 15 || motion_detected) {
    var image_name = camera_id+"_"+hat()+".png";
    require("fs").writeFile("public/imgs/camera_photos/"+image_name, image_b64, 'base64', function(err) {
      winston.debug("Image saved");
      image_counter = 0;
      motion_detected = false;
      clarifai.models.predict(Clarifai.GENERAL_MODEL, config.server_url+"/imgs/camera_photos/"+image_name).then(
        function(response) {
          var outputs = response.data.outputs;
          for(var i=0; i<outputs.length; i++) {
            var concepts = outputs[i].data.concepts;
            for(var j=0; j<concepts.length; j++) {
              // winston.debug(concepts[j].name);
              if(concepts[j].name == 'person' || concepts[j].name == 'man' || concepts[j].name == 'woman') {
                if(concepts[j].value>.5) {
                  motion_detected = true;
                }
              }
              if(concepts[j].name == 'no person' || concepts[j].name == 'no people') {
                no_person = true;
              }
            }
          }

          if(no_person) {
            no_person = false;
            motion_detected = false;
          }

          if(motion_detected && !last_image_motion) {
            last_image_motion = true;
            sendText(camera_id);
          } else if(!motion_detected) {
            last_image_motion = false;
          }

          var people_detected = (motion_detected)? 1 : 0
          db.run('INSERT INTO photo_data (camera_id, image_name, people_detected, created_at) VALUES(?, ?, ?, ?)', [camera_id, image_name, people_detected, moment().utc().format()], function (error) {
            if (error) {
              winton.debug(error);
              winston.debug("database insert error");
            } else {
              winston.debug("inserted photo_data -- image:"+image_name+" people detected:"+people_detected);
            }
          });
        },
        function(err) {
          winston.error(err);
        }
      );
    });
  }
}

function sendText(camera_id) {
  db.get("SELECT contact_number from cameras where id=?", [camera_id], function(error, row) {
    if(error || row == undefined) {
      winston.error("Getting number failed");
    } else {
      twilio_sms.messages.create({
        to: row.contact_number,
        from: config.twilio_sms.number,
        body: "We've detected someone in one of your cameras. Watch it live here: "+config.server_url
      }, function(error, message) {
          if (error) {
            winston.error(error);
          } else {
            winston.debug("Message sent");
          }
      });
    }
  });
}
