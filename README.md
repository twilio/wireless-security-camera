# Security Camera
### Build a remote security monitoring device.

**Disclaimer: The blueprints and information made available on this page are examples only and are not to be used for production purposes. Twilio disclaims any warranties and liabilities under any legal theory (including, without limitation, breach of contract, tort, and indemnification) in connection with your use of or reliance on the blueprints. Any liabilities that arise in connection with your use of these blueprints shall solely be borne by you. By accessing and downloading these blueprints, you agree to the foregoing terms.**

**Problem** All businesses require safety for their property, assets, and employees, but most cannot afford or fully rely on a hired security team, putting what they hold so valuable at risk. If they had a low-cost, reliable, and technical security solution, they would have more peace of mind about the protection of their resources.

**Solution** We’ll create a Twilio-powered device that keeps watch over dangerous and remote locations and alerts stakeholders of intrusions or safety concerns. The device captures images at regular intervals and pushes them through Twilio’s pipeline to a third party API such as [Clarifai](https://www.clarifai.com/) for analysis. Constantly monitoring those results, the device notifies stakeholders of intrusions that threaten assets or safety.

**Degree of Difficulty (1-5): 3**  This device requires some knowledge of Raspberry Pi, software installation, and some Linux features including the command line.

### What You’ll Need

Before we get started, here's a quick overview of what you'll need to build the Security Camera

**Electronic Components**

* [Raspberry Pi Zero](https://www.adafruit.com/products/2885)
* [Raspberry Pi Camera](https://www.adafruit.com/products/3099)
* [Raspberry Pi Zero Camera Connector](https://www.adafruit.com/products/3157)
* [USB 3G Modem](http://www.newegg.com/Product/Product.aspx?Item=9SIA72540S1185&ignorebbr=1&nm_mc=KNC-GoogleMKP-PC&cm_mmc=KNC-GoogleMKP-PC-_-pla-_-Modems-_-9SIA72540S1185&gclid=CPnFsJ6s8dACFQdYDQodPtAE_A&gclsrc=aw.ds)
* [External Battery/Power Bank](https://www.amazon.com/Aukey-PB-N37-5000mAh-Ultra-Portable-Smartphones/dp/B015E363IK/ref=sr_1_1?ie=UTF8&qid=1478402174&sr=8-1&keywords=B015E363IK)
* [8" USB Cable Micro B to Micro B](https://www.startech.com/Cables/USB-2.0/USB-Adapters/usb-otg-cable-micro-micro~UUUSBOTG8IN)
* [Micro USB Female Waterproof Connector](http://www.usbfirewire.com/parts/rr-11a200-80.html#RR-11A200-80)
* [Seal Cap](http://www.usbfirewire.com/parts/rr-1c522122.html#RR-1C522122)
* [6" USB Cable A Male to Micro B Male](https://www.amazon.com/Micro-USB-Cable-Type-Motorola/dp/B01B4GAWII/ref=sr_1_1?ie=UTF8&qid=1478402202&sr=8-1&keywords=B01B4GAWII)
* [6" USB Cable A Female to Micro B Male](https://www.amazon.com/Adapter-Samusung-Android-Windows-Function/dp/B00LN3LQKQ/ref=sr_1_1?ie=UTF8&qid=1478402225&sr=8-1&keywords=B00LN3LQKQ)

**Other Hardware**

* 6x [Thumb Screws For Body Covers 4-40x5/16"](https://www.mcmaster.com/#91746a624/=15us5bo)
* 6x [Threaded Inserts for Body Covers 4-40 Thread](https://www.mcmaster.com/#92395a112/=15us5k4)
* 2x [Screws for Camera Cover 2-56x1/4"](https://www.mcmaster.com/#92949a077/=15us5ua)
* 2x [Threaded Inserts for Camera Cover 2-56 Thread](https://www.mcmaster.com/#92395a111/=15us62bp)
* 2x [Threaded Inserts for Camera Cover 1/4"-20 Thread](https://www.mcmaster.com/#92395a116/=16vapiu)
* 1x [Bob Smith 103 Insta-Cure 2oz Super Thin Glue](https://www.amazon.com/Bob-Smith-Insta-Cure-Super-Thin/dp/B001NI4JWI)

**(Optional) 3D-Printed Parts** In addition to the electronic components and mechanical hardware, the body of the Security Camera is fabricated from 3D-printed parts. You can download the [3D CAD Model here](models/01%20Body%20Option%202.STL) Using this 3D CAD Model, you have a few options for actually building the body:

* Print it, if you have access to a 3D printer.
* Alternatively, if you don't have access to 3D printer or want to ensure quality, you could use a third-party 3D printing service. We recommend [Sculpteo](http://sculpteo.com) or [Voodoo Manufacturing](https://voodoomfg.com/).

**(Optional) Laser Cut Parts** The Security Camera has three clear cover panels that attach to the outside of the 3D-printed case. You will need to build these as well.
You can download the [two panel models here](models/cameraCoverPlateP.dxf) and the [camera cover panel model here](models/cameraLensCoverPlateP.dxf).
As with the body, you can make the panels yourself based on the designs or choose to use a third-party service. We again recommend [Sculpteo](http://sculpteo.com).

_Whether you are cutting and printing yourself or using a service, **double-check the units and dimensions of all parts after uploading**._

**Computer Equipment** You will need acccess to a PC or Mac. You will also need the following to configure the Pi:
* Micro SD card (minimum 8GB recommended)
* USB keyboard
* USB mouse
* External monitor
* Mini HDMI adaptor (to connect to your monitor. If standard HDMI, we recommend [this one](https://www.amazon.com/gp/product/B01K7ERQ8W/ref=oh_aui_detailpage_o01_s00?ie=UTF8&psc=1).)
* Micro USB to USB A OTG hubs (We used [this one](https://www.adafruit.com/products/2991).)
* Micro USB cable
* USB charging plug (such as a phone charger)

### (Optional) Finishing

**(Optional) 3D-Printed Parts** Surface finishes and residues left on the parts will vary depending on the type of printer or service used to produce them. Third-party producers should produce finishes to specification and clean parts before they ship, but prints done yourself will require special attention.

* Always be sure to clean parts thoroughly according to the printer manufacturer’s directions. Double-check hard-to-reach areas like screw holes; these areas may need to be scraped out.
* Check to make sure that there are no remaining residues that could prevent adhesives or glues from performing adequately. If you are able to scrape material off a surface with your fingernail, it is likely that any adhesive used in that area will be unreliable.
* For cosmetic finishing in these areas, diligent 400-grit wet sanding will clean off the residue and leave a smooth, matte surface.
* For areas that will be covered by wires or electronic components, residues must be scraped off before assembly can begin. Any small, hard steel tool can be used. (Dental picks and chisels should work well.) Don’t worry about the appearance, as these areas will be covered after assembly.

**(Optional) Laser-Cut Parts** If you have access to a table router with a 45° chamfer bit, adding a small bevel to the outside edge of the acrylic can clean up the appearance of these parts. When assembling, be sure to keep the side with the bevel facing away from the enclosure.

### Let’s Build It!

#### Step 1: Install threaded inserts.
Once your parts are cleaned and finished, and you have all the necessary hardware, you need to insert the screw-to-expand threaded inserts into their holes.

* The [security camera body](models/01%20Body%20Option%202.STL) uses three different sizes of threaded insert:
* Two 2-56 inserts are used in the circular camera pocket.
* Four 4-40 inserts are used in the rectangular component pockets.
* Two ¼-20 inserts are used on the outer edges.

**Press the inserts in by hand** to hold them in place, then **use a hammer to tap them in** until they are flush. A narrow tool such as a nail set may be helpful to do this without damaging the surrounding plastic.

#### Step 2: Assemble the 3G modem.

The 3G modem is essential to both the setup of the system and the monitoring application itself. It is also very simple to assemble.

![image alt text*](images/image_0.jpg)

* **First, lay out the modem and SIM card**. The 3G modem in the system needs to have a special SIM card. (**Note**: removal of the cap isn’t necessary; it’s pictured this way solely for orientation purposes.)
* On the main body of the 3G modem, **slide the top of the case open**. It will slide open about an eighth of an inch.

![image alt text*](images/image_1.jpg)

* **Lift the lid upwards and set aside**.

It’s now time to install the SIM card. Because this is a full-size SIM card, you’ll have to use the top port in the modem. Refer to the drawing on the modem, which shows the card needs to have the contacts face-down.

![image alt text*](images/image_2.jpg)

* With the SIM card in this orientation, **slide it into the 3G modem**. You will also see that the card will terminate with an outline around it.

![image alt text*](images/image_3.jpg)

* Now that the SIM card is installed, **reassemble the case**.

The 3G modem is now ready!

#### Step 3: Set up the Raspberry Pi Zero base hardware and software. First use.

You must first set up the Raspberry Pi Zero outside of the completed system. This should only take a few minutes.

**The Download:**

* On a separate PC, go to the Raspberry Pi Foundation and **download the latest version of their** [‘RASPBIAN’ operating system](https://www.raspberrypi.org/downloads/raspbian/)**. We recommend going with the full version as opposed to the ‘Lite’ alternative. If the download is slow, you may want to try downloading through the torrent option instead.

**The Software Set-up:**

* The Raspberry Pi website details how to install the downloaded operating system onto your SD card. Instructions are linked below.
  * [Windows](https://www.raspberrypi.org/documentation/installation/installing-images/windows.md)
  * [Mac](https://www.raspberrypi.org/documentation/installation/installing-images/mac.md)
  * [Linux](https://www.raspberrypi.org/documentation/installation/installing-images/linux.md)
* Voila–the SD Card is ready to run the Pi. **Place the card into the Raspberry Pi Zero’s SD card socket**.

**The Hardware Set-up:**

Again, it’s important to do all the setup of the Raspberry Pi Zero outside of the Security Camera enclosure, which is why we’re tackling that first.

* **Grab your USB OTG hub**, which you will need to connect your input peripherals to the Pi. Plug in a keyboard, mouse, and the assembled 3G modem.
* **Plug all the necessary components into the hub** and then into the USB port on the Raspberry Pi Zero. The other port is for power, but we’ll get to that later.
* **Plug the Raspberry Pi Zero into your monitor**. The Raspberry Pi Zero has a Mini HDMI port onboard; you will need to get either the correct cable needed to plug into your monitor of choice, or you can get a Mini HDMI to HDMI adapter and go from there. We used a Mini HDMI adapter, [found here](https://www.amazon.com/gp/product/B01K7ERQ8W/ref=oh_aui_detailpage_o01_s00?ie=UTF8&psc=1).

Now it’s time to power the Raspberry Pi Zero. The power port uses a Micro USB cable, like many other devices. Feel free to use one from another device along with a USB plug. We recommend using one that can output 2A. Alternatively, you can use the external battery pack you are going to use in the Security Camera itself. Make sure it’s fully charged.

* **Plug it in, and the Raspberry Pi Zero will power on by itself**. If everything is working correctly, you will see a green LED on the Raspberry Pi Zero and the bootup information on your monitor.

Now it’s time to move to the desktop.

* First we need to **connect the Raspberry Pi Zero to a cellular network**.
  1. Open the browser (icon is to the right of the raspberry). 
  2. Enter ```192.168.1.1``` in the address bar. This should open the settings page for the Huawei cellular dongle.  
  3. From the navigation bar, select **Settings**, expand **Dial-up** from the menu on the left, and then select **Profile Management**. 
  4. Verify **APN:** is set to **wireless.twilio.com**. 
  5. Select **Mobile Connection** from the menu. 
  6. Select **Auto** mode and allow **Roaming**. 
  7. To test, attempt to load a website. If you receive a message stating **There is no internet connection**, a route is needed:
      1. Open a terminal window by either: 
          * clicking on the terminal icon
          * typing **Alt + F2**, entering **lxterminal** as the command to execute and clicking **OK**
      2. Type ```sudo route add default gw 192.168.1.1 eth0```
      3. Re-test internet access

* Next is to **enable the camera**, and there are two different options to do that:
  1. From the desktop, **go to Preferences>Raspberry Pi Configuration**.
  ![image alt text](images/image_4.png)
  2. The second option it to do it from the command line. **Type the following:** ```sudo raspi-config```

  3. **In the menu system, scroll down to enable camera**.

![image alt text*](images/image_5.jpg)

* We recommend **rebooting the Raspberry Pi Zero** at this point.

#### Step 4: Setup the server

Directions on the server setup can be found [here](node/README.md)

#### Step 5: Set up the Raspberry Pi Zero ‘Security Camera’ software

* Directions for setting up and running the Security Camera script can be found [here](pi/README.md)
* You are now ready to assemble the camera enclosure.
* **Shut down the Raspberry Pi Zero and disconnect everything**.

#### Step 6: Install the Raspberry Pi Zero camera cable.

![image alt text*](images/image_6.jpg)

This is the Raspberry Pi Zero camera and camera cable.

![image alt text*](images/image_7.jpg)

* Flip the camera over **to expose the backside of the board. Keep in mind that the camera lens is now touching the surface you are on—make sure it is one that won’t damage the camera lens.

![image alt text*](images/image_8.jpg)

* Once flipped over, you will see the camera connector. **Lightly pull at the edges to open the push/pull slide**. This will ‘unlock’ the port.

![image alt text*](images/image_9.jpg)![image alt text*](images/image_10.jpg)

* Place the camera cable into the port **with the exposed contacts facing the camera’s PCB board.
* Then **push the push/pull slide lock back down**. This will ‘lock’ the cable in place. Be careful here, as with very little force, one could easily rip the cable out of the connector.
* Now the camera board is ready, so you can **set it aside** until later.

#### Step 7: Assemble the components inside the enclosure – the control side.

![image alt text*](images/image_11.jpg)

* To attach the Micro USB Female Waterproof Connector (USB Bulkhead) to the case, first **remove the lock down hex nut and sealing cap**.

* There is a ½" diameter hole on the opposite side of the system enclosure to the camera portion. This is where we will place the USB Bulkhead.

![image alt text*](images/image_37.jpg)

*  **Push the USB Bulkhead into place**.

![image alt text*](images/image_13.jpg)

* **Place the ring portion of the sealing cap onto the threads of the USB Bulkhead**. Be sure to align the flat part of the ring with the flat part of the threaded section of the bulkhead, or the nut may not thread all the way.

![image alt text*](images/image_14.jpg)

* Now, **thread the nut onto the USB Bulkhead**. A final quarter turn from a wrench is recommended.

![image alt text*](images/image_38.jpg)

* Within the system parts, you will find an 8" USB Cable Micro B Male to Micro B Male cable. **Plug one end to the inside of the USB bulkhead**.

![image alt text*](images/image_39.jpg)

* **Run the cable along the track inside the system enclosure**.
* Along the way, **add some small drops of glue to hold the cable in place**. We recommend using a thin cyanoacrylate for affixing all cables**. **
* **Run the cable down the track and through to the other side of the enclosure**.

It’s now time to install the Raspberry Pi Zero camera and camera cable. The camera will sit on the opposite side of the bulkhead.

 ![image alt text*](images/image_16.jpg)

* First, stick a piece of 3M VHB or similar adhesive to the back of the camera module. Multiple pieces may need to be stacked for the camera to sit flat. Alternatively, **add a dab of glue **to the ribbon cable connector just before final placement in the enclosure.
* There is a slot on one side of the camera location. **Place the cable through the slot**, while the camera is face down. (**Note**: Again, make sure the surface you have the camera on is soft. Otherwise, it might damage the camera or lens.)

![image alt text*](images/image_17.jpg)

* **Gently pull the camera cable through while seating the camera into the square pocket.**

![image alt text*](images/image_18.jpg)

* Now, gently** fold the camera over and into place**, pointing the lens outward.

![image alt text*](images/image_19.jpg)

* Now that the camera is seated, attach the [circular cover](models/cameraLensCoverPlateP.dxf) over the camera. **Place the disc over the camera and align the holes**.
* **Use an allen key (hex wrench) to tighten down the two #2-56x1/4" bolts**.

![image alt text*](images/image_20.jpg)

You’ll be following a similar method attaching the Raspberry Pi Zero as you did attaching the camera cable to the camera module. You will notice that the connector is much smaller, so be gentle.

![image alt text*](images/image_21.jpg)![image alt text*](images/image_22.jpg)

* Make sure the portion of the cable with the exposed contacts faces the Raspberry Pi Zero’s PCB (or, the white side up). **Slide the cable in until it stops and gently lock down the camera connector tab**.
* There is a shallow rectangular pocket in the top portion of the enclosure. This is where the Raspberry Pi Zero will sit.

![image alt text*](images/image_23.jpg)

* Stick a piece of adhesive or add a dab of glue to the back (unbranded side) of the Pi.

![image alt text*](images/image_24.jpg)

* **Gently twist the Raspberry Pi Zero around and into the pocket**. Make sure that the two micro USB ports on the Pi are pointed down and you can see the Raspberry Pi logo. Also be sure not to kink the camera ribbon cable.

![image alt text*](images/image_25.jpg)

* **Take the 6" USB Cable A Male to Micro B Male cable** from the parts for the system, and **plug the Micro USB end into the Raspberry Pi Zero USB port labeled ‘PWR IN’ (Power In)**.

![image alt text*](images/image_26.jpg)

* As with the bulkhead cable, **place the cable down the track directly below the USB port, adding glue periodically to hold the cable in place**.
* **Direct the USB A Male end** to the other side of the enclosure.
* You should have one USB cable left: a 6" USB Cable A Female to Micro B Male. **Plug the micro USB end into the port on the Raspberry Pi Zero labeled ‘USB.’**
* **Follow the track below the port and lay the cable into it, adding glue periodically to hold it in place**.
* **Route the USB Female A end **to the other side of the enclosure.

![image alt text*](images/image_27.jpg)![image alt text*](images/image_28.jpg)

At this point, the control side of the Security Camera system is complete!

You can now **attach [one of the covers](models/cameraCoverPlateP.dxf)** onto the side of the system. The covers for the sides of the camera are identical.

* **Try laying a cover into the pocket**; if the holes line up and the cover seats properly into its recess, you can screw in your thumb screws.
* If not, **try rotating the cover 180 degrees**. The holes should now line up.
* **Use the** **4-40x5/16" thumb screws for the body covers** from your collection of mechanical hardware for the system.

**Note**: If you are having trouble with threading all the way down, you just need to crank down harder; the pocket beneath may just be a little tight. It’s OK to use a tool for this, however, when the head of the thumb screw touches the plexiglass plate, STOP. Any more pressure might crack the side covers.

![image alt text*](images/image_29.jpg)

#### Step 8: Configure the power and data connection – on the other side.

* **Flip the enclosure over**. You should see the three cable ends you routed through from the other side.
* **Find your assembled 3G modem**.

![image alt text*](images/image_30.jpg)

* The pocket on the right is just slightly larger in size than the 3G modem. **Plug the 3G modem into the USB Female A ended cable.**

![image alt text*](images/image_31.jpg)

* **Stick a strip of adhesive or a add dab of glue to the modem and lay it flat in the pocket**.
* On the left side, where there are two cables, is where the battery pack will sit.

![image alt text*](images/image_32.jpg)

* **Add a strip of adhesive or glue to the underside of the battery**, so that the Micro USB port is directly beneath the USB A port.

![image alt text*](images/image_33.jpg)

* **Attach the micro USB cable first**.

**Note**: The charging cable for the battery is connected to the USB bulkhead.

* The second cable, the USB Male A ended cable, applies power to the Raspberry Pi Zero. Once you plug this in, the system will boot. **Plug it in**.

![image alt text*](images/image_34.jpg)

* **Take the battery pack and lay it in place** with the two USB ports pointing down towards the cables and the Micro USB port beneath the USB A port.

![image alt text*](images/image_35.jpg)

* Finally, take the last enclosure side cover and **attach it as you did the other side**.

The camera is on, and ready to deploy!

![image alt text*](images/image_36.jpg)

**Optional:** You can sit this camera anywhere, of course. It also has a universal tripod mount on two sides. For example, you can use a tall tripod or light-stand, set the viewpoint high, and easily capture a whole room.

#### Step 9: Test

Log onto the server that you set up in step 4 and if everything is set up correctly you should see images coming through from your camera!

