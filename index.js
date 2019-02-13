// index.js
// Copyright (C) 2019 Gab AI, Inc.
// Copyright (C) 2013 Satheesh K Natesan
// License: MIT

'use strict';

const MIN_IMAGE_SIZE = 50;

const request = require("request");
const adblock = require("./lib/adblock.js");
const urlObj = require("url");
const cheerio = require("cheerio");

function isAdUrl (url) {
	if (url) {
		return adblock.isAdUrl(url);
	}
	return false;
}

function createResponseData (
	url,
	loadFailed,
	title,
	description,
	contentType,
	mediaType,
	images,
	videos,
	audios
) {
	return {
		url: typeof url === 'string' ? url : url.url,
		loadFailed: loadFailed,
		title: title,
		description: description,
		contentType: contentType,
		mediaType: mediaType || "website",
		images: images,
		videos: videos,
		audios: audios
	};
}

function getTitle (doc) {
	var title = doc("title").text();
	if ((title === undefined) || !title) {
		title = doc("meta[property='og:title']").attr("content");
	}
	return title;
}

function getDescription (doc) {
	var description = doc("meta[name=description]").attr("content");
	if (description === undefined) {
		description = doc("meta[name=Description]").attr("content");
		if (description === undefined) {
			description = doc("meta[property='og:description']").attr("content");
		}
	}
	return description;
}

function getMediaType (doc) {
	var node = doc("meta[name=medium]");
	var content;
	if (node.length) {
		content = node.attr("content");
		return content === "image" ? "photo" : content;
	} else {
		return doc("meta[property='og:type']").attr("content");
	}
}

function getImages (doc, pageUrl) {
	var images = [], src;
	var width, height, dic;

	var nodes = doc("meta[property='og:image']");
	if (nodes.length) {
		nodes.each(function (index, node) {
			src = node.attribs.content;
				if (src) {
					src = urlObj.resolve(typeof pageUrl === 'string' ? pageUrl : pageUrl.url, src);
					images.push(src);
				}
			}
		);
	}

	if (images.length <= 0) {
		src = doc("link[rel=image_src]").attr("href");
		if (src) {
			src = urlObj.resolve(pageUrl, src);
			images = [ src ];
		} else {
			nodes = doc("img");
			if (nodes.length) {
				dic = { };
				images = [ ];
				nodes.each(function(index, node) {
					src = node.attribs["src"];
					if (src && !dic[src]) {
						dic[src] = 1;
						width = node.attribs.width || MIN_IMAGE_SIZE;
						height = node.attribs.height || MIN_IMAGE_SIZE;
						src = urlObj.resolve(pageUrl, src);
						if (width >= MIN_IMAGE_SIZE && height >= MIN_IMAGE_SIZE && !isAdUrl(src)) {
							images.push(src);
						}
					}
				});
			}
		}
	}
	return images;
}

function getVideos(doc) {
	var videos,
		nodes, nodeTypes, nodeSecureUrls,
		nodeType, nodeSecureUrl,
		video, videoType, videoSecureUrl,
		width, height,
		videoObj, index, length;

	nodes = doc("meta[property='og:video']");
	length =  nodes.length;
	if (length) {
		videos = [];
		nodeTypes = doc("meta[property='og:video:type']");
		nodeSecureUrls = doc("meta[property='og:video:secure_url']");
		width = doc("meta[property='og:video:width']").attr("content");
		height = doc("meta[property='og:video:height']").attr("content");

		for (index = 0; index < length; index++) {
			video = nodes[index].attribs.content;

			nodeType = nodeTypes[index];
			videoType = nodeType ? nodeType.attribs.content : null;

			nodeSecureUrl = nodeSecureUrls[index];
			videoSecureUrl = nodeSecureUrl ? nodeSecureUrl.attribs.content : null;

			videoObj = { url: video, secureUrl: videoSecureUrl, type: videoType, width: width, height: height };
			if (videoType.indexOf("video/") === 0) {
				videos.splice(0, 0, videoObj);
			} else {
				videos.push(videoObj);
			}
		}
	}

	return videos;
}

function parseResponse (body, url) {
	var doc,
		title,
		description,
		mediaType,
		images,
		videos;

	doc = cheerio.load(body);
	title = getTitle(doc);

	description = getDescription(doc);

	mediaType = getMediaType(doc);

	images = getImages(doc, url);

	videos = getVideos(doc);

	return createResponseData(
		url,
		false,
		title,
		description,
		"text/html",
		mediaType,
		images,
		videos
	);
}

function parseMediaResponse(res, contentType, url) {
	if (contentType.indexOf("image/") === 0) {
		return createResponseData(url, false, "", "", contentType, "photo", [url]);
	} else {
		return createResponseData(url, false, "", "", contentType);
	}
}

module.exports = (options, callback) => {
	if (typeof options === 'string') {
		options = { url: options };
	}
	options = options || { };
	options = Object.assign(options, {
		timeout: 10000
	});

	var req = request(options, (err, response, body) => {
		if (!err && (response.statusCode === 200) && body) {
			callback(null, parseResponse(body, options));
		} else {
			callback(null, createResponseData(options, true));
		}
	});

	req.on("response", (res) => {
		var contentType = res.headers["content-type"];
		if (contentType && (contentType.indexOf("text/html") !== 0)) {
			req.abort();
			callback(null, parseMediaResponse(res, contentType, options) );
		}
	});
};