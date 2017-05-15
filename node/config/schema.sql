CREATE TABLE cameras (
  id INTEGER primary key autoincrement,
  name TEXT,
  contact_number TEXT,
  twilio_sid TEXT,
  token TEXT,
  created_at TIMESTAMP
);

CREATE TABLE photo_data (
  id integer primary key autoincrement,
  camera_id INTEGER,
  image_name TEXT,
  people_detected INTEGER,
  created_at TIMESTAMP,
  FOREIGN KEY(camera_id) REFERENCES cameras(id)
);
