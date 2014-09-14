/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
$(document).bind("mobileinit", function() {
	//allow cross-domain requests
	$.mobile.allowCrossDomainPages = true;
});

// The watch id references the current `watchAcceleration`
var watchID = null;

var app = {
	// Application Constructor
	initialize : function() {

		this.bindEvents();
	},
	// Bind Event Listeners
	//
	// Bind any events that are required on startup. Common events are:
	// 'load', 'deviceready', 'offline', and 'online'.
	bindEvents : function() {
		if ("cordova" in window) {
			document.addEventListener('deviceready', this.onDeviceReady, false);
		} else {
			this.onDeviceReady();
		}
	},
	// deviceready Event Handler
	//
	// The scope of 'this' is the event. In order to call the 'receivedEvent'
	// function, we must explicity call 'app.receivedEvent(...);'
	onDeviceReady : function() {
		app.receivedEvent('deviceready');
		if (navigator.splashscreen) {
			navigator.splashscreen.hide();
		}
		//load cross-domain pages
		$.support.cors = true;

		startWatch();
		// check for cache
		// first see if cache date is stored
		var updateFeed = refreshNeeded();
		if (localStorage["entries"] && updateFeed == false) {
			entries = JSON.parse(localStorage["entries"]);
			getItems(entries);
		} else {
			getFeed(false);
		}
	},
	// Update DOM on a Received Event
	receivedEvent : function(id) {
		var parentElement = document.getElementById(id);
		var listeningElement = parentElement.querySelector('.listening');
		var receivedElement = parentElement.querySelector('.received');

		listeningElement.setAttribute('style', 'display:none;');
		receivedElement.setAttribute('style', 'display:block;');

		console.log('Received Event: ' + id);
	}
};

/**
 * if true then refresh is needed because it has been at least an hour
 **/
function refreshNeeded() {

	if (localStorage["timestamp"] != undefined) {
		var input_date = parseInt(localStorage["timestamp"]);

		var d = new Date();
		var curr_date = d.getTime();
		var last_hour = curr_date - 3600000;

		if (input_date - last_hour < 0) {
			return true;

		} else {
			return false;
		}
	} else {
		return false;
	}
}

/**
 *  Retrieve the feed contents
 *  Feed API does caching so unpopular feeds take longer to update
 **/
function getFeed(forceRefresh) {
	var url = 'http://feeds.feedburner.com/invisibleoranges';
	var jsonp = 'http://ajax.googleapis.com/ajax/services/feed/load?hl=en&v=1.0&num=10&output=json&q=' + encodeURIComponent(url);
	$.ajax({
		url : jsonp,
		type : "GET",
		timeout : 5000,
		contentType : "application/json",
		dataType : 'jsonp',
		jsonpCallback : 'getEntries',
		error : function(xhr, status) {
			if (localStorage["entries"]) {
				entries = JSON.parse(localStorage["entries"]);
				getItems(entries);
			} else {
				alertMsg('Error - Could not retrieve feed.');
			}
		},
		success : function() {
			if (forceRefresh == true) {
				alertMsg('Refreshed');
			}
			// automatically check the feed again after 3 hours, just in case we are hanging out here
			var threehours = 10800000;
			setTimeout(getFeed(false), 3000);
		}
	});
}

/**
 *  store the feed data
 *  @param obj  the json data
 **/
function getEntries(json) {

	if (!json.responseData.feed.entries)
		return false;

	if (localStorage["entries"]) {
		var feedequal = _.isEqual(localStorage["entries"], JSON.stringify(json));
		if (!feedequal) {
			alertMsg("Refreshed content");

		}
	} else {
		alertMsg("Retrieved new content");
	}
	localStorage["entries"] = JSON.stringify(json);
	// set timestamp
	var d = new Date();
	localStorage["timestamp"] = d.getTime();
	getItems(json);
}

/**
 *  Process the feed data
 *  @param the json data
 **/
function getItems(json) {
	var articleLength = json.responseData.feed.entries.length;

	var content = '';
	for (var i = 1; i <= articleLength; i++) {
		var entry = json.responseData.feed.entries[i - 1];
		var date = entry.publishedDate;
		date = date.substr(0, 26);
		content = content + '<li><a href="#"><span style="display:none;">' + i + '</span>' + entry.title + '<br/>' + date + '</a></li>';
	}
	$('#list').html(content);
	$("#list").listview("refresh");

	$('#list li a').on('click', function(e) {
		var index = $(this).find("span").text();

		var title = json.responseData.feed.entries[index - 1].title;
		$('#article_title').html(title);

		var article = json.responseData.feed.entries[index - 1].content;
		$('#article_content').html(article);

		var url = json.responseData.feed.entries[index - 1].link;
		$('#article_url').attr('href', url);

		$('#article_url').off();
		$('#article_url').on('click', function(e) {
			e.preventDefault();
			var url = $(this).attr('href');
			openBrowser(url);
		});
		$('#article_content a').off();
		$('#article_content a').on('click', function(e) {
			e.preventDefault();
			var url = $(this).attr('href');
			openBrowser(url);
		});

		$.mobile.changePage("#article");
	});

}

/**
 * open the url
 **/
function openBrowser(url) {
	if (navigator.app) {
		navigator.app.loadUrl(encodeURI(url), {
			openExternal : true
		});
	} else {
		var ref = window.open(encodeURI(url), '_system', 'location=yes,EnableViewPortScale=yes,closebuttoncaption=Done');
	}
}

/**
 *  Use the notification plugin if available, otherwise use browser alert
 *  @param string the title of the notification window
 *  @param string the text for the notification window
 **/
function alertMsg(title, msg) {
	if (msg == undefined) {
		msg = '';
	}
	if (navigator.notification) {
		navigator.notification.alert(msg, null, title, "Dismiss")
		navigator.notification.vibrate(2500);
	} else {
		alert(title);
	}
}

// can force a refresh by shaking
// http://code.tutsplus.com/tutorials/phonegap-from-scratch-device-apis--mobile-9291
function startWatch() {
	if (navigator.accelerometer) {

		var previousReading = {
			x : null,
			y : null,
			z : null
		}

		navigator.accelerometer.watchAcceleration(function(acceleration) {
			var changes = {}, bound = 10;
			if (previousReading.x !== null) {
				changes.x = Math.abs(previousReading.x, acceleration.x);
				changes.y = Math.abs(previousReading.y, acceleration.y);
				changes.z = Math.abs(previousReading.z, acceleration.z);
			}

			if ((changes.x > bound && changes.y > bound) || (changes.x > bound && changes.z > bound) || (changes.y > bound && changes.z > bound)) {
				shaken();
			}

			previousReading = {
				x : acceleration.x,
				y : acceleration.y,
				z : acceleration.z
			}

		}, onError, {
			frequency : 2000
		});
	}
}

function shaken() {
	getFeed(true);
}

// Error
function onError() {
	// ignore error
	//alert('onError!');
}