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

var online_streamers = [];
var online_games = [];
var online_titles = [];
var online_viewers = [];
var online_previews = [];
var online_avatars = [];
var offline_streamers = [];
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
var panelOn = false
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
    label: "Click to open the followed streamers list",
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
    width: 500,
    height: 500,
    onHide: handleHide
});

function handleChange(state) {
    if (state.checked) {
        button.label = "Click to close the followed streamers list"
        panelOn = true
        panel.show({
            position: button
        });
    }
}

function handleHide() {
    button.label = "Click to open the followed streamers list"
    panelOn = false
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
                //console.log("Alarm automatically stopped")
            if (panelOn) {
                panelUpdate()
            }
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
        if (response.json == null) {
            return;
        }
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

//Now for my work...

function manageOnlineStreamers(remadd, name_, game_, title_, viewers_, preview_, avatar_) {
    //0 to remove, 1 to add, 2 to update
    if (remadd == 0) {
        var namekey = online_streamers.indexOf(name_)
        if (namekey > -1) {
            online_streamers.splice(namekey, 1)
            online_games.splice(namekey, 1)
            online_titles.splice(namekey, 1)
            online_viewers.splice(namekey, 1)
            online_previews.splice(namekey, 1)
            online_avatars.splice(namekey, 1)
        }
    }
    if (remadd == 1) {
        online_streamers.unshift(name_)
        online_games.unshift(game_)
        online_titles.unshift(title_)
        online_viewers.unshift(viewers_)
        online_previews.unshift(preview_)
        online_avatars.unshift(avatar_)
    }
    if (remadd == 2) {
        var namekey = online_streamers.indexOf(name_)
        online_games[namekey] = game_
        online_titles[namekey] = title_
        online_viewers[namekey] = viewers_
        online_previews[namekey] = preview_
        online_avatars[namekey] = avatar_
    }
    if (panelOn) {
        panelUpdate()
    }
    //Let's update the panel too while we're changing values...
}

function manageUniqueIds(addcheckrem, value1, id) {
    //0 to add/update, 1 to check, 2 to remove
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
                ss.storage.streamIds.unshift(value1 + "," + id)
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
            //Streamer has been unfollowed
            //console.log("Removing " + keyname + " from the online streamers list for being unfollowed")
            manageUniqueIds(2, keyname)
            manageOnlineStreamers(0, keyname)
        }
        checkChannel(function(response) {
            if (response.json == null) {
                //Error has occured
                return;
            }
            if (typeof response.json.status != 'undefined' && response.json.status != 200) {
                //Error has occured
                //console.error("Error: [" + response.json.status + "] " + response.json.message);
                return;
            }
            var stream = response.json.stream
            if (stream == null) {
                if (!(containsValue(counter_names, keyname))) {
                    //Twitch API says streamer is online
                    console.log(keyname + " may have gone offline. Starting counter test...")
                    counter_names.unshift(keyname)
                    counter_nums.unshift(0)
                } else {
                    var magicnum = Math.ceil(preferences.debounce_interval / waittime)
                    var index1 = counter_names.indexOf(keyname)
                    counter_nums[index1] = (counter_nums[index1] + 1)
                        console.log(keyname, counter_nums[index1])
                    if (counter_nums[index1] >= magicnum) {
                        //Streamer is confirmed offline
                        console.log(keyname + " has been offline for enough consecutive time. Confirmed as offline.")
                        manageUniqueIds(2, keyname)
                        manageOnlineStreamers(0, keyname)
                        counter_names.splice(index1, 1);
                        counter_nums.splice(index1, 1);
                    }
                }
            } else if ((stream != null) && (containsValue(counter_names, keyname))) {
                //Streamer has come back online
                //console.log(keyname + " has come back online. Counter test concluded.")
                var index2 = counter_names.indexOf(keyname)
                counter_names.splice(index2, 1)
                counter_nums.splice(index2, 1)
                manageUniqueIds(0, keyname, stream._id)
            } else {
                //Streamer is online as normal
                var strname = stream.channel.name
                var game = stream.channel.game
                var title = stream.channel.status
                var viewers = stream.viewers
                var preview = "http://static-cdn.jtvnw.net/previews-ttv/live_user_" + strname + "-320x180.jpg"
                var avatar = stream.channel.logo
                var namekey = online_streamers.indexOf(strname)
                if ((game != online_games[namekey]) || (title != online_titles[namekey]) || (avatar != online_avatars[namekey]) || (viewers != online_viewers[namekey])) {
                    //Something has changed... time to update
                    manageOnlineStreamers(2, strname, game, title, viewers, preview, avatar)
                }
            }
        }, keyname)
    }
}

function updateChannels() {
    updateBadge()
    offline_streamers = generateOfflineStreamers()
    if (!(containsValue(followed_streamers, alarmCause)) && (alarmCause != "")) {
        //console.log("Alarm cause is no longer being followed")
        clearInterval(alarm_interval)
        alarmOn = false
        alarmCause = ""
        if (panelOn) {
            panelUpdate()
        }
    }
    if (!(containsValue(online_streamers, alarmCause)) && (alarmCause != "")) {
        //console.log("Alarm cause is no longer online")
        clearInterval(alarm_interval)
        alarmOn = false
        alarmCause = ""
        if (panelOn) {
            panelUpdate()
        }
    }
    cleanOnlineStreamers()
    checkChannels(function(response) {
        if (response.json == null) {
            return;
        }
        if (typeof response.json.status != 'undefined' && response.json.status != 200) {
            //console.error("Error: [" + response.json.status + "] " + response.json.message);
            return;
        }
        var stream = response.json.stream
        if (stream != null) {
            var strname = stream.channel.name
            var game = stream.channel.game
            var title = stream.channel.status
            var viewers = stream.viewers
            var preview = "http://static-cdn.jtvnw.net/previews-ttv/live_user_" + strname + "-320x180.jpg"
            var avatar = stream.channel.logo
            var strid = stream._id
            if (!(containsValue(online_streamers, strname))) {
                //New streamer has come online
                manageOnlineStreamers(1, strname, game, title, viewers, preview, avatar)
                if ((!alarmOn) && !(manageUniqueIds(1, strname, strid))) {
                    alarmOn = true
                    alarmCause = strname
                    playAlert()
                    alarm_interval = setInterval(playAlert, 1000) //this is the alarm part
                    if (panelOn) {
                        panelUpdate()
                    }
                }
                manageUniqueIds(0, strname, strid)
            }
        } else {
            //Followed streamer is stil offline
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
    panelUpdate()
});

panel.port.on("openTab", function(payload) {
    tabs.open("http://www.twitch.tv/" + payload)
})

panel.port.on("endAlarm", function() {
    if (alarm_interval != null) {
        clearInterval(alarm_interval)
        alarmOn = false
        alarmCause = ""
            //console.log("Alarm stopped")
    }
    if (panelOn) {
        panelUpdate()
    }
})

function panelUpdate() {
    //Should update when something has changed or alarm turns off
    panel.port.emit("updatePage", [online_streamers, online_games, online_titles, online_viewers, online_previews, online_avatars, offline_streamers, alarmOn, followed_streamers, preferences.defaultHide, preferences.defaultHide2, preferences.sortingMethod]);
}

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