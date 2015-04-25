var { ActionButton } = require("sdk/ui/button/action");

var self = require("sdk/self");
var pgworkr = require("sdk/page-worker")
var preferences = require("sdk/simple-prefs").prefs;
var online_streamers = [];
var followed_streamers = (preferences.streamer_list).split(",");
var waittime = preferences.update_interval
var blank = self.data.url("blank.html")
var {setInterval, clearInterval, setTimeout, clearTimeout}  = require("sdk/timers")
var Request = require("sdk/request").Request;
var tabs = require("sdk/tabs")
var alarmOn = false
var alarmCause = ""
var alarm_interval = null
var update_interval = null
var badge_timeout = null
var httpHeaders = {
	'Accept': "application/vnd.twitchtv.v2+json",
	'Client-ID': "t163mfex6sggtq6ogh0fo8qcy9ybpd6"
};

var button = ActionButton({
    id: "my-button",
    label: "Loading...",
    icon: {
      "16": "./ico16.png",
      "32": "./ico32.png",
	  "64": "./ico64.png"   
    },
    badge: null,
    badgeColor: "#6441A5",
    onClick: function(state) {
        if (alarm_interval != null) {
			clearInterval(alarm_interval)
			alarmOn = false
			alarmCause = ""
            console.log("Alarm stopped")
        }
        if (online_streamers[online_streamers.length-1] != "") {
            tabs.open("http://www.twitch.tv/" + online_streamers[online_streamers.length-1])
        }
		//playAlert()
    }
  });

function updateBadge() {
    if (online_streamers.length >0) {
        button.badge = online_streamers.length
    } else {
        button.badge = null
    }
    
}

function resetBadgeColor() {
	button.badgeColor = "#6641A5"
	clearTimeout(badge_timeout)
}

function playAlert() {
	button.badgeColor = "#FF0000"
	badge_timeout = setTimeout(resetBadgeColor, 250)
    pgworkr.Page({
		contentScript: "new Audio('alert2.ogg').play()",
		contentURL: blank
	});
}

//Credit for these next two functions goes to Ben Clive

function checkChannels(callbackFunc, favList) {
	for( var key in favList) {
		var request = Request({
			url: "https://api.twitch.tv/kraken/streams/"+favList[key],
			onComplete: callbackFunc,
			headers: httpHeaders
		});
		request.get();
	}
}

function checkChannel(callbackFunc, channel) {
	if (typeof(channel)!="string") {
		return ;
	}
	var request = Request({
		url: "https://api.twitch.tv/kraken/streams/"+channel,
		onComplete: callbackFunc,
		headers: httpHeaders
	});
	request.get();
}

function containsValue(list, obj) {
	if ((list.indexOf(obj)) > -1) {
		return true
	} else {
		return false	
	}
}

function onOff(bool) {
	if (bool) {
		return "Online"
	} else {
		return "Offline"
	}
}

function cleanOnlineStreamers() {
	for( var key in online_streamers) {
		if (!(containsValue(followed_streamers,online_streamers[key]))) {
			console.log("Removing " + online_streamers[key] + " from the online streamers list")
			online_streamers.splice(key, 1);
		}
		checkChannel(function(response) {
			if( typeof response.json.status != 'undefined' && response.json.status != 200 ) {
				console.error("Error: [" + response.json.status + "] " + response.json.message);
				return;
			}
			var stream = response.json.stream
			if (stream==null) {
                online_streamers.splice(index, key);
			}
		}, online_streamers[key])
	}
}

function generateList() {
	var string = ""
	var string1 = ""
	var string2 = ""
	if ((followed_streamers.length == 0) || (followed_streamers[0]=="")) {
		return string
	} else {
		if (online_streamers.length > 0) {
			string = "\n"
		}
		for (var key in followed_streamers) {
			if (containsValue(online_streamers, followed_streamers[key])){
				string1 = string1 + "\n" + followed_streamers[key] + ": Online"
			} else if (followed_streamers[key] != "")  {
				string2 = string2 + "\n" + followed_streamers[key] + ": Offline"
			}
		}
		return string+string1+"\n"+string2
	}
}

function updateChannels() {
	updateBadge()
	if (online_streamers[online_streamers.length-1] == "" || typeof(online_streamers[online_streamers.length-1] == "undefined")) {
		button.label = "No recent followed streamers have been online" + generateList()
	} else {
		button.label = "Left click: Go to " + online_streamers[online_streamers.length-1] + "'s stream. Current status: " + onOff(containsValue(online_streamers, online_streamers[online_streamers.length-1])) +  generateList()
	}
	if (!(containsValue(followed_streamers, alarmCause)) && (alarmCause != "")) {
		console.log("Alarm cause is no longer being followed")
		clearInterval(alarm_interval)
		alarmOn = false
		alarmCause = ""
	}
	cleanOnlineStreamers()
	checkChannels(function(response) {
		if( typeof response.json.status != 'undefined' && response.json.status != 200 ) {
			console.error("Error: [" + response.json.status + "] " + response.json.message);
			return;
		}
		var stream = response.json.stream
		if( stream != null ) {
			var strname = stream.channel.name
			if (!(containsValue(online_streamers, strname))) {
				console.log(strname + " is online")
				console.log(online_streamers)
				online_streamers.push(strname)
				if (!alarmOn) {
					alarmOn = true
					alarmCause = strname
					playAlert()
					alarm_interval = setInterval(playAlert, 1000) //this is the alarm part
				}
			}
		} else {
			/*if (containsValue(online_streamers, strname)) {
                var index = online_streamers.indexOf(strname)
                if (index > -1) {
                    online_streamers.splice(index, 1);
                }
            }*/
		}
	}, followed_streamers);
}

update_interval = setInterval(updateChannels, waittime*1000);
updateChannels()

if (preferences.update_interval<1) {
    preferences.update_interval = 1
}

function onListChange() {
    var followed_streamers2 = (preferences.streamer_list).split(",")
	var followed_streamers3 = []
	for (var key in followed_streamers2) {
		var newname = followed_streamers2[key].replace(/ /g, "");
		followed_streamers3.push(newname)
	}
	followed_streamers = followed_streamers3
}

function onIntervalChange() {
    waittime = preferences.update_interval
	clearInterval(update_interval)
	update_interval = setInterval(updateChannels, waittime*1000)
}

require("sdk/simple-prefs").on("streamer_list", onListChange);
require("sdk/simple-prefs").on("update_interval", onIntervalChange);

updateChannels();