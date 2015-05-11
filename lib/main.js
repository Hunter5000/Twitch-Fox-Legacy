var {
    ToggleButton
} = require("sdk/ui/button/toggle");

var panels = require("sdk/panel")
var self = require("sdk/self");
var pgworkr = require("sdk/page-worker")
var ss = require("sdk/simple-storage");
var preferences = require("sdk/simple-prefs").prefs;
if (((typeof(ss.storage.streamIds) == "undefined") && (preferences.uniqueIds)) || !(preferences.uniqueIds)) {
    ss.storage.streamIds = []
}
var offline_streamers = [];
var last_streamer = [];
var last_game = [];
var online_streamers = [];
var online_games = [];
var counter_names = [];
var counter_nums = [];
var followed_streamers = (preferences.streamer_list).split(",");
var waittime = preferences.update_interval
var blank = self.data.url("blank.html")
var {
    setInterval, clearInterval, setTimeout, clearTimeout
} = require("sdk/timers")
var Request = require("sdk/request").Request;
var tabs = require("sdk/tabs")
var alarmOn = false
var alarmCause = ""
var alarm_interval = null
var update_interval = null
var badge_timeout = null
var alarm_counter = 0
var httpHeaders = {
    'Accept': "application/vnd.twitchtv.v2+json",
    'Client-ID': "t163mfex6sggtq6ogh0fo8qcy9ybpd6"
};

var button = ToggleButton({
    id: "my-button",
    label: "Loading...",
    icon: {
        "16": "./ico16.png",
        "32": "./ico32.png",
        "64": "./ico64.png"
    },
    badge: null,
    badgeColor: "#6441A5",
    onChange: handleChange
});

var panel = panels.Panel({
    contentURL: self.data.url("streamerList.html"),
    onHide: handleHide
});

function handleChange(state) {
    if (state.checked) {
        panel.show({
            position: button
        });
    }
}

function handleHide() {
    button.state('window', {
        checked: false
    });
}

function updateBadge() {
    if (online_streamers.length > 0) {
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
    if (!(preferences.soundAlarmOff)) {
        pgworkr.Page({
            contentScript: "new Audio('alert2.ogg').play()",
            contentURL: blank
        });
    }
    if (preferences.alarm_length > 0) {
        alarm_counter = alarm_counter + 1
        if (alarm_counter >= Math.ceil(preferences.alarm_length)) {
            alarm_counter = 0
            clearInterval(alarm_interval)
            alarmOn = false
            alarmCause = ""
            panel.port.emit("updatePage", [last_streamer, last_game, online_streamers, online_games, offline_streamers, alarmOn, followed_streamers]);
            //console.log("Alarm automatically stopped")
        }
    } else {
        alarm_counter = 0
    }
}

function containsValue(list, obj) {
    if ((list.indexOf(obj)) > -1) {
        return true
    } else {
        return false
    }
}

//Credit for these next four functions goes to Ben Clive

function checkChannels(callbackFunc, favList) {
    for (var key in favList) {
        var request = Request({
            url: "https://api.twitch.tv/kraken/streams/" + favList[key],
            onComplete: callbackFunc,
            headers: httpHeaders
        });
        request.get();
    }
}

function checkChannel(callbackFunc, channel) {
    if (typeof(channel) != "string") {
        return;
    }
    var request = Request({
        url: "https://api.twitch.tv/kraken/streams/" + channel,
        onComplete: callbackFunc,
        headers: httpHeaders
    });
    request.get();
}

function getFollowedChannels(callbackFunc, name, offset) {
    var request = Request({
        url: "https://api.twitch.tv/kraken/users/" + name + "/follows/channels?offset=" + offset + "&limit=25&sortby=created_at&direction=DESC",
        onComplete: callbackFunc,
        headers: httpHeaders
    });
    request.get();
}

function importFollowers(name, offset) {
    //console.log("Importing followed channels from " + name + "...")
    getFollowedChannels(function(response) {
        if (typeof response.json.status != 'undefined' && response.json.status != 200) {
            //console.error("Error: [" + response.json.status + "] " + response.json.message);
            return;
        }
        var follows = response.json.follows;
        for (var key in follows) {
            var item = follows[key];
            var channelName = item.channel.name;
            if (!containsValue(followed_streamers, channelName)) {
                preferences.streamer_list = preferences.streamer_list + ", " + channelName
                if (preferences.streamer_list.slice(0, 2) == ", ") {
                    preferences.streamer_list = preferences.streamer_list.slice(2)
                }
                onListChange()
            }
        }
        // Get more if they exist
        //console.log("About to check for more followers: " + offset + "/" + response.json._total);
        if (response.json._total > (offset + 25)) {
            //console.log("Checking name " + name + " with offset " + offset);
            importFollowers(name, offset + 25);
        } else {
            //console.log("Import process complete")
        }
    }, name, offset);
}

function manageUniqueIds(addcheckrem, value1, id) {
    if (preferences.uniqueIds) {
        if (addcheckrem == 1) {
            for (var key in ss.storage.streamIds) {
                var tabl = ss.storage.streamIds[key].split(",")
                var name = tabl[0]
                var id2 = tabl[1]
                if (name == value1) {
                    return (id == id2)
                }
            }
        } else {
            for (var key in ss.storage.streamIds) {
                var tabl = ss.storage.streamIds[key].split(",")
                var name = tabl[0]
                if (name == value1) {
                    ss.storage.streamIds.splice(key, 1)
                }
            }
            if (addcheckrem == 0) {
                ss.storage.streamIds.push(value1 + "," + id)
            }
        }
    } else {
        //console.log("Unique stream ID storage system disabled")
    }

}

function cleanOnlineStreamers() {
    for (var key in online_streamers) {
        var keyname = online_streamers[key]
        if (!(containsValue(followed_streamers, keyname))) {
            //console.log("Removing " + keyname + " from the online streamers list for being unfollowed")
            manageUniqueIds(2, keyname)
            online_streamers.splice(key, 1);
            online_games.splice(key, 1);
            panel.port.emit("updatePage", [last_streamer, last_game, online_streamers, online_games, offline_streamers, alarmOn, followed_streamers]);
        }
        checkChannel(function(response) {
            if (typeof response.json.status != 'undefined' && response.json.status != 200) {
                //console.error("Error: [" + response.json.status + "] " + response.json.message);
                return;
            }
            var stream = response.json.stream
            if (stream == null) {
                if (!(containsValue(counter_names, keyname))) {
                    //console.log(keyname + " may have gone offline. Starting counter test...")
                    counter_names.push(keyname)
                    counter_nums.push(0)
                } else {
                    var magicnum = Math.ceil(preferences.debounce_interval / waittime)
                    var index1 = counter_names.indexOf(keyname)
                    counter_nums[index1] = (counter_nums[index1] + 1)
                        //console.log(keyname, counter_nums[index1])
                    if (counter_nums[index1] >= magicnum) {
                        //console.log(keyname + " has been offline for enough consecutive time. Confirmed as offline.")
                        manageUniqueIds(2, keyname)
                        online_streamers.splice(key, 1);
                        online_games.splice(key, 1);
                        counter_names.splice(index1, 1);
                        counter_nums.splice(index1, 1);
                        panel.port.emit("updatePage", [last_streamer, last_game, online_streamers, online_games, offline_streamers, alarmOn, followed_streamers]);
                    }
                }
            } else if ((stream != null) && (containsValue(counter_names, keyname))) {
                //console.log(keyname + " has come back online. Counter test concluded.")
                var index2 = counter_names.indexOf(keyname)
                counter_names.splice(index2, 1)
                counter_nums.splice(index2, 1)
                manageUniqueIds(0, keyname, stream.channel._id)
                panel.port.emit("updatePage", [last_streamer, last_game, online_streamers, online_games, offline_streamers, alarmOn, followed_streamers]);
            }
        }, keyname)
    }
}

function generateList() {
    var string = ""
    var string1 = ""
    var string2 = ""
    if ((followed_streamers.length == 0) || (followed_streamers[0] == "")) {
        //console.log(followed_streamers[0])
        return string
    } else {
        if (online_streamers.length > 0) {
            string = "\n"
        }
        for (var key in followed_streamers) {
            if (containsValue(online_streamers, followed_streamers[key])) {
                string1 = string1 + "\n" + followed_streamers[key] + ': Online. Playing: "' + online_games[online_streamers.indexOf(followed_streamers[key])] + '"'
            } else if (followed_streamers[key] != "") {
                string2 = string2 + "\n" + followed_streamers[key] + ": Offline"
            }
        }
        return string + string1 + "\n" + string2
    }
}

function updateChannels() {
    updateBadge()
    panel.port.emit("updatePage", [last_streamer, last_game, online_streamers, online_games, offline_streamers, alarmOn, followed_streamers]);
    last_streamer = online_streamers[online_streamers.length - 1]
    last_game = online_games[online_games.length - 1]
    offline_streamers = generateOfflineStreamers()
    if (online_streamers[online_streamers.length - 1] == "" || typeof online_streamers[online_streamers.length - 1] == "undefined") {
        button.label = "No streamers are currently online" + generateList()
    } else if (alarmOn) {
        button.label = "Left click: Disable alarm\nDouble click: Go to " + online_streamers[online_streamers.length - 1] + "'" + 's stream. Playing: "' + online_games[online_games.length - 1] + '"' + generateList()
    } else {
        button.label = "Left click: Go to " + online_streamers[online_streamers.length - 1] + "'" + 's stream. Playing: "' + online_games[online_games.length - 1] + '"' + generateList()
    }
    if (!(containsValue(followed_streamers, alarmCause)) && (alarmCause != "")) {
        //console.log("Alarm cause is no longer being followed")
        clearInterval(alarm_interval)
        alarmOn = false
        alarmCause = ""
        panel.port.emit("updatePage", [last_streamer, last_game, online_streamers, online_games, offline_streamers, alarmOn, followed_streamers]);
    }
    if (!(containsValue(online_streamers, alarmCause)) && (alarmCause != "")) {
        //console.log("Alarm cause is no longer online")
        clearInterval(alarm_interval)
        alarmOn = false
        alarmCause = ""
        panel.port.emit("updatePage", [last_streamer, last_game, online_streamers, online_games, offline_streamers, alarmOn, followed_streamers]);
    }
    cleanOnlineStreamers()
    checkChannels(function(response) {
        if (typeof response.json.status != 'undefined' && response.json.status != 200) {
            //console.error("Error: [" + response.json.status + "] " + response.json.message);
            return;
        }
        var stream = response.json.stream
        if (stream != null) {
            var strname = stream.channel.name
            var game = stream.channel.game
            var strid = stream.channel._id
            if (!(containsValue(online_streamers, strname))) {
                //console.log(strname + " has gone online")
                //console.log(online_streamers)
                online_streamers.push(strname)
                online_games.push(game)
                    /*if (manageUniqueIds(1,strname,strid)) {
                        //console.log("Same stream as before, not playing alarm")
                    }*/
                if ((!alarmOn) && !(manageUniqueIds(1, strname, strid))) {
                    alarmOn = true
                    alarmCause = strname
                    playAlert()
                    alarm_interval = setInterval(playAlert, 1000) //this is the alarm part
                    panel.port.emit("updatePage", [last_streamer, last_game, online_streamers, online_games, offline_streamers, alarmOn, followed_streamers]);
                }
                manageUniqueIds(0, strname, strid)
                panel.port.emit("updatePage", [last_streamer, last_game, online_streamers, online_games, offline_streamers, alarmOn, followed_streamers]);
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

update_interval = setInterval(updateChannels, waittime * 1000);
updateChannels()

if (preferences.update_interval < 1) {
    preferences.update_interval = 1
}

function generateOfflineStreamers() {
    var offstreamers = []
    for (var key in followed_streamers) {
        if (!(containsValue(online_streamers, followed_streamers[key]))) {
            offstreamers.push(followed_streamers[key])
        }
    }
    return offstreamers
}

panel.on("show", function() {
    //console.log("Shipping payload...")
    panel.port.emit("updatePage", [last_streamer, last_game, online_streamers, online_games, offline_streamers, alarmOn, followed_streamers]);
});

panel.port.on("openTab", function(payload) {
    tabs.open("http://www.twitch.tv/" + payload)
})

panel.port.on("endAlarm", function() {
    if (alarm_interval != null) {
        clearInterval(alarm_interval)
        alarmOn = false
        alarmCause = ""
        panel.port.emit("updatePage", [last_streamer, last_game, online_streamers, online_games, offline_streamers, alarmOn, followed_streamers]);
        //console.log("Alarm stopped")
    }
    panel.port.emit("updatePage", [last_streamer, last_game, online_streamers, online_games, offline_streamers, alarmOn, followed_streamers]);
})

function onListChange() {
    var followed_streamers2 = (preferences.streamer_list).split(",")
    var followed_streamers3 = []
    for (var key in followed_streamers2) {
        var newname = followed_streamers2[key].replace(/ /g, "");
        followed_streamers3.push(newname.toLowerCase())
    }
    followed_streamers = followed_streamers3
}

function onIntervalChange() {
    waittime2 = preferences.update_interval
    if (waittime2 < 1) {
        waittime2 = 1
    }
    waittime = waittime2
    clearInterval(update_interval)
    update_interval = setInterval(updateChannels, waittime * 1000)
}

require("sdk/simple-prefs").on("importClick", function() {
    importer = preferences.import_user
    importer = importer.replace(/ /g, "")
    if (importer != "") {
        //console.log(importer)
        importFollowers(importer, 0)
        preferences.import_user = ""
    }
});

require("sdk/simple-prefs").on("streamer_list", onListChange);
require("sdk/simple-prefs").on("update_interval", onIntervalChange);

updateChannels();
onListChange();