# Remote Monitor
### Remote Security Monitoring


## Getting Started
### Installation
In order to get your custom backend up and running you will need a few things installed on your computer.

**NodeJS**: Node can be downloaded and installed from https://nodejs.org/en/. If you are installing on linux via a package manager. Instructions can be found at https://nodejs.org/en/download/package-manager/

**Localtunnel**: In order to run the Bean Counter server locally you will need to open up a port on your computer. The easiest way to do that is with Localtunnel. Instructions for installation can be found here https://localtunnel.github.io/www/

**Clarifai API**: The Remote Monitor sends photos up to an API which determines if there are people in the photo. We use the Clarifai API for this. You can sign up for free at https://www.clarifai.com/

****

### Setup

**Configuration**: The Remote Monitor server talks to the Twilio API, the Clarifai API and our SQLite database. We need to set the correct values for each in our config/config.js file.

* The **server_url** config value will be set when you set up localtunnel.

* The **sqlite3** config value should only be changed if you want to change the location of the database file.

* The Twilio config values will need to be updated with your Account SID and your account Auth Token from the [Twilio dashboard](https://www.twilio.com/console). You will need these values for both the sim card and your SMS account. For sending text messages you will also have to set your twilio phone number which can also be found on the Twilio Dashboard.

        "twilio_sim": {
          "account_sid": "xxxx",
          "auth_token": "xxxx"
        },
        "twilio_sms": {
          "account_sid": "xxxx",
          "auth_token": "xxxx",
          "number": "xxxxxxxxxxx"
        }

* The Clarifai API access token can be found in your Clarifai dashboard after you log in.

        "clarifai": {
          "client_id": "xxxx",
          "client_secret": "xxxx"
        }

**NPM Packages**: To install all the needed node packages change directory to the remote monitor node directory and install.

    npm install

****

### Running the Server

Now that all setup is complete it's time to run the server. Make sure that you are in the node directory, and run:

    npm start

This will start the server on your computer on port 8000. http://localhost:8000

****

### Connecting the Remote Monitor to the server

Now that your server is running you'll need to make sure that the Remote Monitor can connect and send it's data.

**Start localtunnel**: In order to enable the Remote Monitor to talk to your local server we need to install and start localtunnel which will open up your server for requests.

**Note:** If you are running this software on your own web server rather than on your computer you will skip this step and use the URL of the server as the **server_url** config value.

1. Install localtunnel
2. Start localtunnel on port 8000
3. You will need this URL when setting up your Remote Monitor's Python script.

        npm install -g localtunnel
        lt --port 8000
        your url is: http://xxxx.localtunnel.me

4. Enter this URL as your **server_url** in the [config.js](config/config.js) file and save it for the Remote Monitor's Python script setup.

**Adding the camera**: The first thing we'll need to do is add the camera to your database. This can be done from the web interface.

1. Go to [your server](http://localhost:8000)
* Click the "Cameras" link at the top.
* Click the "Add New Camera" button to show the device form.
* Enter all device information and click submit. **Note**: Twilio SID is your sim card SID and can be found in your [Twilio dashboard](https://www.twilio.com/console).
* You will need the Camera ID, Name, and Token when setting up your Remote Monitor's Python script.

**Setting up the Raspberry Pi Script**
Your server should be ready to go. The instructions for setting up the Pi script are located [in the pi directory](../pi/README.md)

****

### Custom Backend Features

**Dashboard Page**: Lists all active monitors and live-updates images as they are uploaded from the camera.

**Single Camera Page**: Contains the last 6 photos where a person was detected in frame.

**Add Camera page**: Allows the user to add new monitors and shows a table of all the monitors in the system and all of their information.
