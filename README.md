# FlashAssassin - Toshiba FlashAir™ browser client


FlashAssassin is a browser client application for the amazing Toshiba
FlashAir™ SD card (a memory card that has a built-in wifi access point).
It is installed right on the card itself and can easily be used with any
HTML5-compliant browser.

The app allows photographers and their audience to review the pictures on a
larger screen, such as a laptop, a projector or a mobile phone. This can be
useful for shootings, workshops, demonstrations etc., whenever a cable would
disturb.

The project provides a single page web application built on AngularJS 1,
Bootstrap 3 and a few other libraries.
It also includes a test server written in Python that provides a compatible
implementation of the FlashAir API and thus can be used for debugging and
testing the web app during development.

The project was inspired by JSFlashAero by Christian Holl
(https://github.com/C-X1/JSFlashAero).


## Roadmap

  - display graphs like cameras show it
    - histogram (combined or separated by color)
  - display EXIF information
    - resolution and aspect ratio
    - file size
    - aperture
    - exposure time
    - sensor sensitivity (ISO value)
    - focal length
      - focal length translated to 35mm film


## Installation

Just copy the directory `FlashAssassin` into the card's root directory.


## Usage

Connect to the FlashAir wifi, open your browser and navigate to
http://flashair/FlashAssassin/index.html.


## More information

For more information on the FlashAir™ wireless SD cards, see
http://www.toshiba-memory.com.sg/wireless_sdcard.html.
