import json
import time
import base64
import urllib2
from picamera import PiCamera
from socketIO_client import SocketIO, BaseNamespace

# Get camera
camera = PiCamera()
camera.resolution = (320, 240)

# Address of the where we store the image locally
image_addr = "/home/pi/Documents/twilio/images/captured_image.jpg"
# Server info
server_url = "http://xxxx.localtunnel.me"
server_port = 80
# Camera info
camera_name = "xxxx"
camera_token = "xxxxx"
camera_id = 0;

class Namespace(BaseNamespace):
  def on_connect(self):
    print('[Connected to socket]')

def waitForInternet():
  while True:
    try:
      response = urllib2.urlopen(server_url+":"+str(server_port), timeout=1)
      return
    except urllib2.URLError:
      pass

def mainLoop():
  socketIO = SocketIO(server_url, server_port, Namespace)
  while True:

    # Capture an image using the Pi Camera
    camera.capture(image_addr)

    # Set up data
    image_data = base64.b64encode(open(image_addr).read())
    params = json.dumps({ "id": camera_id, "name": camera_name, "image": image_data, "token": camera_token })

    # send to server
    print('Sending image to server');
    socketIO.emit('new-image', params)
    # socketIO.wait(seconds=1)

waitForInternet()
mainLoop()
