# hydra-page-previewer

Simple web page scraper which returns basic preview info like title, description, images, videos using request and cheerio modules.

This fork of [page-previewer](https://github.com/myspace/page-previewer) is maintained by [Gab AI, Inc](https://gab.com/).

## Changes

The following changes have been made to the module since forking.

### v0.1.5

- Fix page title logic

### v0.1.3

- Updated request from v2.12.0 to v2.88.0 to address a security concern
- Accept full request options
- 'use strict'
- Code cleanup

## Install

    npm install hydra-page-previewer

## How to use

```javascript
var preview = require("hydra-page-previewer");
preview("http://www.google.com", function(err, data) {
	if(!err) {
		console.log(data); //Prints the meta data about the page
	}
});
```

You can set a proxy server too
```javascript
var preview = require("hydra-page-previewer");
preview({ url: "http://www.google.com", proxy: "{server name}", function(err, data) {
	if(!err) {
		console.log(data); //Prints the meta data about the page
	}
});
```
returns

```json
{ url: 'http://www.google.com',
  loadFailed: false,
  title: 'Google',
  description: 'Search the world\'s information, including webpages, images, videos and more. Google has many special features to help you find exactly what you\'re looking for.',
  contentType: 'text/html',
  mediaType: 'website',
  images: [ 'http://www.google.com/intl/en_ALL/images/srpr/logo1w.png' ],
  videos: undefined,
  audios: undefined }
 ```
