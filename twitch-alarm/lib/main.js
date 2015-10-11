const {
    Cc, Ci, Cu
} = require("chrome")
var {
    ToggleButton
} = require("sdk/ui/button/toggle")

var _ = require("sdk/l10n").get
var panels = require("sdk/panel")
var self = require("sdk/self")
var system = require("sdk/system")
var pgworkr = require("sdk/page-worker")
var utils = require('sdk/window/utils')
var ss = require("sdk/simple-storage")
var preferences = require("sdk/simple-prefs")
var notifications = require("sdk/notifications")

Cu.import("resource://gre/modules/osfile.jsm")

//When creating a new stored setting....

//Change these default settings
//Change default settings in SettingScript... multiple locations
//Remove setting on add-on unloading
//Add to SettingScript -> Main.js payload
//Add to Main.js -> SettingScript payload

//Default settings
//Follower
if (ss.storage.followedStreamers == null) {
    ss.storage.followedStreamers = []
}

//Alarm
if (ss.storage.updateInterval == null) {
    ss.storage.updateInterval = 60
} else if (ss.storage.updateInterval < 60) {
    ss.storage.updateInterval = 60
}

if (ss.storage.desktopNotifs == null) {
    ss.storage.desktopNotifs = true
}

if (ss.storage.soundAlarm == null) {
    ss.storage.soundAlarm = true
}

if (ss.storage.alarmVolume == null) {
    ss.storage.alarmVolume = 100
}

if (ss.storage.alarmInterval == null) {
    ss.storage.alarmInterval = 1
}

if (ss.storage.restrictAlarm == null) {
    ss.storage.restrictAlarm = false
}

if (ss.storage.restrictFrom == null) {
    ss.storage.restrictFrom = "22:00:00"
}

if (ss.storage.restrictTo == null) {
    ss.storage.restrictTo = "06:00:00"
}

if (ss.storage.customAlarm == null) {
    ss.storage.customAlarm = ""
}

if (ss.storage.alarmLimit == null) {
    ss.storage.alarmLimit = false
}
if (ss.storage.alarmLength == null) {
    ss.storage.alarmLength = 10
}
if (ss.storage.uniqueIds == null) {
    ss.storage.uniqueIds = true
}
if (ss.storage.streamIds == null) {
    ss.storage.streamIds = []
}

//Interface
if (ss.storage.liveQuality == null) {
    ss.storage.liveQuality = "best"
}
if (ss.storage.livePath == null) {
    ss.storage.livePath = ""
}
if (ss.storage.hideAvatar == null) {
    ss.storage.hideAvatar = false
}
if (ss.storage.hideOffline == null) {
    ss.storage.hideOffline = false
}
if (ss.storage.hidePreview == null) {
    ss.storage.hidePreview = false
}
if (ss.storage.sortMethod == null) {
    ss.storage.sortMethod = "recent"
}
if (ss.storage.openTab == null) {
    ss.storage.openTab = true
}
if (ss.storage.openLive == null) {
    ss.storage.openLive = false
}
if (ss.storage.openPopout == null) {
    ss.storage.openPopout = false
}
if (ss.storage.previewWait == null) {
    ss.storage.previewWait = 30
}
if (ss.storage.tutorialOn == null) {
    ss.storage.tutorialOn = true
}
if (ss.storage.darkMode == null) {
    ss.storage.darkMode = false
}

var online_streamers = []
var online_games = []
var online_titles = []
var online_viewers = []
var online_avatars = []
var online_times = []

var waittime = ss.storage.updateInterval

var blank = self.data.url("blank.html")

var {
    setInterval, clearInterval, setTimeout, clearTimeout
} = require("sdk/timers")

var Request = require("sdk/request").Request
var tabs = require("sdk/tabs")
var alarmOn = false
var alarmCause = ""
var panelOn = false
var liveerror = false
var errorcause = ""
var update_interval = null
var badge_timeout = null
var badge_interval = null
var alarm_counter = 0
var searchedChannel = null

var alarm_script = pgworkr.Page({
    contentScriptFile: self.data.url("alarm.js"),
    contentURL: blank
})

var httpHeaders = {
    'Accept': "application/vnd.twitchtv.v3+json",
    'Client-ID': "dzawctbciav48ou6hyv0sxbgflvfdpp" //Now our actual, very own Client ID!
}

var button = ToggleButton({
    id: "my-button",
    label: _("clickOpen_"),
    icon: {
        "16": "./ico16.png",
        "32": "./ico32.png",
        "64": "./ico64.png"
    },
    badge: null,
    badgeColor: "#6441A5",
    onChange: handleChange
})

var panel = panels.Panel({
    contentURL: self.data.url("streamerList.html"),
    width: 500,
    height: 530,
    onHide: handleHide
})

var settingsPanel = panels.Panel({
    contentURL: self.data.url("settings.html"),
    width: 720,
    height: 720
        //onHide: handleHide
})

function openSettings() {
    packageSettings()
    settingsPanel.show({

    })
}

function handleChange(state) {
    if (state.checked) {
        button.label = _("clickClose_")
        panelOn = true
        panel.show({
            position: button
        })
    }
}

function handleHide() {
    if (online_streamers.length > 0) {
        var tempNameGames = []
        for (var key in online_streamers) {
            if (online_games[key]!="!null!") {
                tempNameGames.push(online_streamers[key] + " | " + online_games[key])
            } else {
                tempNameGames.push(online_streamers[key])
            }
        }
        tempNameGames.sort()
        button.label = (_("clickOpen_")+"\n\n"+tempNameGames.join("\n"))
    } else {
        button.label = _("clickOpen_")
    }
    panelOn = false
    button.state('window', {
        checked: false
    })
}

function updateBadge() {
    if (online_streamers.length > 0) {
        button.badge = online_streamers.length
        var tempNameGames = []
        for (var key in online_streamers) {
            if (online_games[key]!="!null!") {
                tempNameGames.push(online_streamers[key] + " | " + online_games[key])
            } else {
                tempNameGames.push(online_streamers[key])
            }
        }
        tempNameGames.sort()
        button.label = (_("clickOpen_")+"\n\n"+tempNameGames.join("\n"))
    } else {
        button.badge = null
        button.label = _("clickOpen_")
    }

}

function flashBadge() {
    button.badgeColor = "#FF0000"
    badge_timeout = setTimeout(resetBadgeColor, 250)
}

function countAlarm() {
    alarm_counter = alarm_counter + 1
    if (alarm_counter > ss.storage.alarmLength) {
        manageAlert(false)
    }
}

function resetBadgeColor() {
    button.badgeColor = "#6641A5"
    clearTimeout(badge_timeout)
}

function cleanse(str) {
    var curvalue = str
    if (typeof(curvalue) == "string") {
        curvalue = curvalue.replace(/ /g, "")
        curvalue = curvalue.toLowerCase()
    }
    return curvalue
}

function seeIfRestricted() {
    var restrictFrom = Number(ss.storage.restrictFrom.replace(/\D/g, ''))
    var restrictTo = Number(ss.storage.restrictTo.replace(/\D/g, ''))
    var newDate = new Date()
    var newHours = String(newDate.getHours())
    var newMins = String(newDate.getMinutes())
    var newSecs = String(newDate.getSeconds())
    if (Number(newHours) < 10) {
        newHours = "0" + newHours
    }
    if (Number(newMins) < 10) {
        newMins = "0" + newMins
    }
    if (Number(newSecs) < 10) {
        newSecs = "0" + newSecs
    }
    var curTime = Number(newHours + newMins + newSecs)
    if (restrictTo <= restrictFrom) {
        if ((curTime >= restrictFrom) || (curTime <= restrictTo)) {
            return true
        } else {
            return false
        }
    } else {
        if ((curTime >= restrictFrom) && (curTime <= restrictTo)) {
            return true
        } else {
            return false
        }
    }
}

function manageAlert(bool) {
    if (bool && (!alarmOn)) {
        badge_interval = setInterval(flashBadge, ss.storage.alarmInterval * 1000)
        var restricted = false
        if (ss.storage.restrictAlarm) {
            restricted = seeIfRestricted()
        }
        if ((ss.storage.soundAlarm) && (!restricted)) {
            if (ss.storage.customAlarm != "") {
                if ((ss.storage.customAlarm.search("http://") != -1) || (ss.storage.customAlarm.search("https://") != -1)) {
                    alarm_script.port.emit("startAlarm", [
                        ss.storage.alarmInterval,
                        0,
                        ss.storage.alarmVolume,
                        ss.storage.customAlarm,
                        null
                    ])
                    alarmOn = true
                } else {
                    var alarmpath1 = ss.storage.customAlarm.replace("\\", "\\\\")
                    var alarmpath2 = OS.Path.toFileURI(alarmpath1)
                    alarm_script.port.emit("startAlarm", [
                        ss.storage.alarmInterval,
                        1,
                        ss.storage.alarmVolume,
                        null,
                        alarmpath2
                    ])
                    alarmOn = true
                }
            } else {
                alarm_script.port.emit("startAlarm", [
                    ss.storage.alarmInterval,
                    2,
                    ss.storage.alarmVolume,
                    null,
                    null
                ])
                alarmOn = true
            }
        }
        if (ss.storage.alarmLimit) {
            setInterval(countAlarm, 1000)
        } else {
            alarm_counter = 0
        }
    } else if (!bool && alarmOn) {
        alarm_script.port.emit("stopAlarm")
        clearInterval(countAlarm)
        alarm_counter = 0
        clearInterval(badge_interval)
        resetBadgeColor()
        alarmOn = false
        alarmCause = ""
            //console.log("Alarm stopped")
        if (panelOn) {
            panelUpdate()
        }
    }
}

function genTime(time) {
    var timeYr = time.slice(0, 4)
    var timeMo = Number(time.slice(5, 7)) - 1
    var timeDy = time.slice(8, 10)
    var timeHr = time.slice(11, 13)
    var timeMn = time.slice(14, 16)
    var timeSc = time.slice(17, 19)
    return Date.UTC(timeYr, timeMo, timeDy, timeHr, timeMn, timeSc)
}

function genTimes() {
    var newtimes = []
    for (var key in online_times) {
        newtimes.push(genTime(online_times[key]))
    }
    return newtimes
}

function genNotif(strname, game, title, avatar) {
    if (avatar == "!null!") {
        avatar = "http://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_150x150.png"
    }
    if (game == "!null!") {
        game = ""
    }
    notifications.notify({
        title: strname + " " + _("hasCome_") + " " + game,
        text: ('"' + title + '"' + "\n\n" + _("clickHere_")),
        iconURL: avatar,
        onClick: function() {
            if (!panelOn) {
                var active = utils.getMostRecentBrowserWindow();
                active.focus()
                panelOn = true
                panel.show({
                    position: button
                })
            }

        }
    })
}

function containsValue(list, obj) {
    if ((list.indexOf(obj)) > -1) {
        return true
    } else {
        return false
    }
}

//Credit for the next function goes to Armin of "Open with Livestreamer"

function buildArgs(streamURL, streamResolution) {
    var args,
        currentURL,
        currentResolution,
        optArgs
        // Get stream url
    currentURL = streamURL
        // Get stream resolution
    if (streamResolution === undefined) {
        if (ss.storage.liveQuality === undefined) {
            currentResolution = "best"
        } else {
            currentResolution = ss.storage.liveQuality
        }
    } else {
        currentResolution = streamResolution
    }
    // Main
    args = [currentURL, currentResolution]
    return args
}

// Run Livestreamer
function runLivestreamer(args) {
    var path,
        file,
        process
        // Notify
        //console.log("Starting livestreamer...")
        // Get livestreamer path
    path = getLivestreamerPath()
    if (path != "!error!") {
        // Build file
        file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile)
        file.initWithPath(path)
            // New child process
        process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess)
        process.init(file)
        process.run(false, args, args.length)
    } else {
        liveerror = true
        panelUpdate()
        liveerror = false
    }

}

// Get Livestreams path
// First check if a user has defined a path
// Otherwise try our best guess for each system
function getLivestreamerPath() {
    var path,
        file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile)
        // User defined
    if (ss.storage.livePath && ss.storage.livePath !== "") {
        path = ss.storage.livePath
        path = path.replace("\\", "\\\\")
    } else if (system.platform == "linux") {
        path = "/usr/bin/livestreamer"
    } else if (system.platform == "winnt") {
        path = "C:\\Program Files (x86)\\Livestreamer\\livestreamer.exe"
    } else if (system.platform == "mac") {
        path = "/Applications/livestreamer.app"
    }
    // Test file
    patherror = false
    try {
        file.initWithPath(path)
    } catch (e) {
        patherror = true
            //console.log("There was an error")
    } finally {
        if (patherror) {
            return "!error!"
        } else {
            if (file.exists()) {
                return path
            } else {
                return "!error!"
            }
        }
    }
}


//Credit for these next four functions goes to Ben Clive of "Twitch.tv Stream Browser"

function checkStreams(callbackFunc, favList, offset) {
    var liststr = favList.join(",")
    if (liststr == "") {
        liststr = "!"
    }
    var request = Request({
        url: "https://api.twitch.tv/kraken/streams?limit=100&offset=" + offset + "&channel=" + liststr,
        onComplete: callbackFunc,
        headers: httpHeaders
    })
    request.get()
}

function checkStream(callbackFunc, channel) {
    if (typeof(channel) != "string") {
        return
    }
    var request = Request({
        url: "https://api.twitch.tv/kraken/streams/" + channel,
        onComplete: callbackFunc,
        headers: httpHeaders
    })
    request.get()
}

function checkChannel(callbackFunc, channel) {
    if (typeof(channel) != "string") {
        return
    }
    var request = Request({
        url: "https://api.twitch.tv/kraken/channels/" + channel,
        onComplete: callbackFunc,
        headers: httpHeaders
    })
    request.get()
}

function getFollowedChannels(callbackFunc, name, offset) {
    var request = Request({
        url: "https://api.twitch.tv/kraken/users/" + name + "/follows/channels?offset=" + offset + "&limit=100&sortby=created_at&direction=DESC",
        onComplete: callbackFunc,
        headers: httpHeaders
    })
    request.get()
}

function importFollowers(name, offset) {
    //console.log("Importing followed channels from " + name + "...")
    getFollowedChannels(function(response) {
        if (response.json == null) {
            panel.port.emit("importComplete")
            return
        }
        if (typeof response.json.status != 'undefined' && response.json.status != 200) {
            //console.error("Error: [" + response.json.status + "] " + response.json.message)
            panel.port.emit("importComplete")
            return
        }
        var follows = response.json.follows
        for (var key in follows) {
            var item = follows[key]
            var channelName = item.channel.name
            if (!containsValue(ss.storage.followedStreamers, channelName)) {
                ss.storage.followedStreamers.unshift(channelName)
                packageSettings()
                if (panelOn) {
                    panelUpdate()
                }
            }
        }
        // Get more if they exist
        //console.log("About to check for more followers: " + offset + "/" + response.json._total)
        if (response.json._total > (offset + 100)) {
            //console.log("Checking name " + name + " with offset " + offset)
            importFollowers(name, offset + 100)
        } else {
            //console.log("Import process complete")
            packageSettings()
            updateChannels()
            panel.port.emit("importComplete")
        }
    }, name, offset)
}

//Now for my work...

function manageOnlineStreamers(remadd, name_, game_, title_, viewers_, avatar_, time_) {
    //0 to remove, 1 to add, 2 to update
    if (remadd == 0) {
        var namekey = online_streamers.indexOf(name_)
        if (namekey > -1) {
            online_streamers.splice(namekey, 1)
            online_games.splice(namekey, 1)
            online_titles.splice(namekey, 1)
            online_viewers.splice(namekey, 1)
            online_avatars.splice(namekey, 1)
            online_times.splice(namekey, 1)
        }
    }
    if (remadd == 1) {
        var namekey = online_streamers.indexOf(name_)
        if (namekey < 0) {
            online_streamers.unshift(name_)
            online_games.unshift(game_)
            online_titles.unshift(title_)
            online_viewers.unshift(viewers_)
            online_avatars.unshift(avatar_)
            online_times.unshift(time_)
        }
    }
    if (remadd == 2) {
        var namekey = online_streamers.indexOf(name_)
        if (namekey > -1) {
            online_games[namekey] = game_
            online_titles[namekey] = title_
            online_viewers[namekey] = viewers_
            online_avatars[namekey] = avatar_
            online_times[namekey] = time_
        }
    }
    if (panelOn) {
        panelUpdate() //Let's update the panel too while we're changing values...
    }
    updateBadge()
}

function checkStrId(id_) {
    if (!containsValue(ss.storage.streamIds, id_) || !ss.storage.uniqueIds) {
        return true
    } else {
        return false
    }
}

function addStrId(id_) {
    if (ss.storage.uniqueIds) {
        if (!containsValue(ss.storage.streamIds, id_)) {
            if (ss.storage.streamIds.length > 99) {
                ss.storage.streamIds.splice(0, 1)
            }
            ss.storage.streamIds.push(id_)
        }
    } else {
        delete ss.storage.streamIds
    }

}

function updateChannels(offset) {
    var offs = 0
    if (offset) {
        offs = offset
    }
    if (!(containsValue(ss.storage.followedStreamers, alarmCause)) && (alarmCause != "")) {
        //console.log("Alarm cause is no longer being followed")
        manageAlert(false)
    }
    if (!(containsValue(online_streamers, alarmCause)) && (alarmCause != "")) {
        //console.log("Alarm cause is no longer online")
        manageAlert(false)
    }
    var temp_online = (online_streamers.join(",")).split(",")
    for (var key in temp_online) {
        if (!(containsValue(ss.storage.followedStreamers, cleanse(temp_online[key])))) {
            //Online channel has been unfollowed
            manageOnlineStreamers(0, temp_online[key])
        }
    }
    if (!alarmOn) {
        clearInterval(countAlarm)
        alarm_counter = 0
        clearInterval(badge_interval)
        resetBadgeColor()
        alarmCause = ""
    }
    checkStreams(function(response) {
        if (response.json != null) {
            if (response.json.error != null) {
                var msg = response.json.message
                var strname = msg.split("'")[1]
                var namekey = ss.storage.followedStreamers.indexOf(strname)
                    //ss.storage.followedStreamers.splice(strname, 1)
            } else {
                var streams = response.json.streams
                var curonline = []
                if (streams != null) {
                    for (var key in streams) {
                        var stream = streams[key]
                            //Now online
                        var strname = stream.channel.display_name
                        curonline.push(strname)
                        var game = stream.channel.game
                        if (game == null) {
                            game = "!null!"
                        }
                        var title = stream.channel.status
                        var viewers = stream.viewers
                        var avatar = stream.channel.logo
                        if (avatar == null) {
                            avatar = "!null!"
                        }
                        var time = stream.created_at
                        var strid = stream._id
                        if (!containsValue(online_streamers, strname)) {
                            //Was offline, now online
                            manageOnlineStreamers(1, strname, game, title, viewers, avatar, time)
                            if ((!alarmOn) && checkStrId(strid)) {
                                if (ss.storage.desktopNotifs) {
                                    genNotif(strname, game, title, avatar)
                                }
                                alarmCause = cleanse(strname)
                                manageAlert(true)
                            }
                            if (panelOn) {
                                panelUpdate()
                            }
                            addStrId(strid)
                        } else {
                            //Was online, still online
                            var namekey = online_streamers.indexOf(strname)
                                //Update: Game, Title, Avatar, Viewers, Time
                            if ((game != online_games[namekey]) || (title != online_titles[namekey]) || (avatar != online_avatars[namekey]) || (viewers != online_viewers[namekey]) || (time != online_times[namekey])) {
                                //Something has changed... time to update
                                manageOnlineStreamers(2, strname, game, title, viewers, avatar, time)
                            }
                        }
                    }
                }
                var temp_online = (online_streamers.join(",")).split(",")
                for (var key in temp_online) {
                    var curoffline = !containsValue(curonline, temp_online[key])
                    if (curoffline) {
                        manageOnlineStreamers(0, temp_online[key])
                    }
                }
            }
            if (response.json._total > (offs + 100)) {
                updateChannels(offs + 100)
            }
        } else {
            //Response not found
        }
    }, ss.storage.followedStreamers, offs)
}

function generateOfflineStreamers() {
    var offstreamers = []
    var lowerOnline = cleanse(online_streamers.join(",")).split(",")
    for (var key in ss.storage.followedStreamers) {
        if (!(containsValue(lowerOnline, ss.storage.followedStreamers[key]))) {
            offstreamers.push(ss.storage.followedStreamers[key])
        }
    }
    return offstreamers
}

function forceRefresh() {
    online_streamers = []
    online_games = []
    online_titles = []
    online_viewers = []
    online_avatars = []
    online_times = []
    panelUpdate()

    updateBadge()
    updateChannels()
}

panel.on("show", function() {
    //console.log("Shipping payload...")
    panelUpdate()
})

panel.port.on("openTab", function(payload) {
    tabs.open("http://www.twitch.tv/" + payload)
})

panel.port.on("unfollow", function(payload) {
    var newname = payload
    if (containsValue(ss.storage.followedStreamers, newname)) {
        var namekey = ss.storage.followedStreamers.indexOf(newname)
            //console.log("Removing due to unfollow")
        ss.storage.followedStreamers.splice(namekey, 1)
        updateChannels()
    }
    panelUpdate()
})

panel.port.on("follow", function(payload) {
    var newname = payload
    if (!(containsValue(ss.storage.followedStreamers, newname))) {
        ss.storage.followedStreamers.unshift(newname)
        updateChannels()
    }
    panelUpdate()
})

panel.port.on("openLive", function(payload) {
    errorcause = payload
    runLivestreamer(buildArgs("http://www.twitch.tv/" + payload, ss.storage.liveQuality))
})

panel.port.on("openSettings", function(payload) {
    openSettings()
})

settingsPanel.port.on("importSettings", function(payload) {
    //Retrieve setting updates
    if (payload[0].length != ss.storage.followedStreamers.length) {
        ss.storage.followedStreamers = payload[0]
        updateChannels()
    } else {
        ss.storage.followedStreamers = payload[0]
    }
    ss.storage.updateInterval = payload[1]
    ss.storage.soundAlarm = payload[2]
    ss.storage.alarmLimit = payload[3]
    ss.storage.alarmLength = payload[4]
    ss.storage.uniqueIds = payload[5]
    ss.storage.streamIds = payload[6]
        //ss.storage.debounce = payload[7]
    ss.storage.liveQuality = payload[8]
    ss.storage.hideAvatar = payload[9]
    ss.storage.hideOffline = payload[10]
    ss.storage.sortMethod = payload[11]
    ss.storage.openTab = payload[12]
    ss.storage.openLive = payload[13]
    ss.storage.openPopout = payload[14]
    ss.storage.previewWait = payload[15]
    ss.storage.tutorialOn = payload[16]
    ss.storage.livePath = payload[17]
    ss.storage.alarmInterval = payload[18]
    ss.storage.restrictAlarm = payload[19]
    ss.storage.restrictFrom = payload[20]
    ss.storage.restrictTo = payload[21]
    ss.storage.customAlarm = payload[22]
    ss.storage.desktopNotifs = payload[23]
    if (ss.storage.alarmVolume != payload[24]) {
        alarm_script.port.emit("volumeChange", payload[24])
    }
    ss.storage.alarmVolume = payload[24]
    ss.storage.hidePreview = payload[25]
    ss.storage.darkMode = payload[26]
})

settingsPanel.port.on("importUser", function(payload) {
    importFollowers(payload, 0)
})

panel.port.on("importUser", function(payload) {
    importFollowers(payload, 0)
})

panel.port.on("forceRefresh", function() {
    forceRefresh()
})

settingsPanel.port.on("forceRefresh", function() {
    forceRefresh()
})

panel.port.on("endAlarm", function() {
    manageAlert(false)
})

function searchTwitch(searchTerm) {
    var output1 = []
    var output2 = []
        //console.log("Now searching " + searchTerm)
    checkStream(function(response) {
        if (response.json != null) {
            //console.log("Stream found")
            var stream = response.json.stream
            if (stream != null) {
                var game = stream.channel.game
                if (game == null) {
                    game = "!null!"
                }
                var strname = stream.channel.display_name
                var avatar = stream.channel.logo
                var status = stream.channel.status
                var views = stream.channel.views
                var followers = stream.channel.followers
                var viewers = stream.viewers
                var time = stream.created_at
                output1 = [viewers, genTime(time)]
                output2 = [strname, avatar, status, game, views, followers]
                if (searchedChannel != null) {
                    finishSearch([output1, output2])
                }
                //console.log("Transmitting back to panel")
            } else {
                checkChannel(function(response) {
                    if (response.json != null) {
                        //console.log("Channel found")
                        if (response.json.error != null) {
                            if (searchedChannel != null) {
                                finishSearch(null)
                            }
                            //console.log("Response was null")
                        } else {
                            var strname = response.json.display_name
                            var avatar = response.json.logo
                            var game = response.json.game
                            var views = response.json.views
                            var followers = response.json.followers
                            if (game == null) {
                                game = "!null!"
                            }
                            if (avatar == null) {
                                avatar = "!null!"
                            }
                            var status = response.json.status
                            if (status == null) {
                                status = ""
                            }
                            output2 = [strname, avatar, status, game, views, followers]
                            if (searchedChannel != null) {
                                finishSearch([output1, output2])
                            }
                        }
                    } else {
                        if (searchedChannel != null) {
                            finishSearch(null)
                        }
                        //console.log("Response was null")
                    }
                }, searchTerm)
            }
        } else {
            if (searchedChannel != null) {
                finishSearch(null)
            }
            //console.log("Response was null")
        }
    }, searchTerm)
}

function finishSearch(payload) {
    searchedChannel = null
    panel.port.emit("searchedChannel", payload)
}


panel.port.on("searchTwitch", function(searchTerm) {
    if (searchTerm != null) {
        if (searchedChannel != null) {
            finishSearch(null)
            searchedChannel = []
            searchTwitch(searchTerm)
        } else {
            searchedChannel = []
            searchTwitch(searchTerm)
        }
    } else {
        finishSearch(null)
    }
})

preferences.on("settingsButton", function() {
    openSettings()
})

function genLocal1() {
    if (_("streamingFor2_") != "streamingFor2_") {
        return [_("streamingFor_"), _("streamingFor2_")]
    } else {
        return [_("streamingFor_"), ""]
    }
}

function panelUpdate() {
    //Should update when something has changed or alarm turns off
    //Give the settings to the panel
    panel.port.emit("updatePage", [
        online_streamers,
        online_games,
        online_titles,
        online_viewers,
        online_avatars,
        genTimes(),
        generateOfflineStreamers(),
        alarmOn,
        ss.storage.followedStreamers,
        ss.storage.hideAvatar,
        ss.storage.hideOffline,
        ss.storage.sortMethod,
        ss.storage.openTab,
        ss.storage.openLive,
        ss.storage.openPopout,
        ss.storage.previewWait,
        ss.storage.tutorialOn,
        alarmCause,
        liveerror,
        errorcause,
        ss.storage.hidePreview,
        genLocal1(),
        _("separator_"), _("searchStreamers_"),
        ss.storage.darkMode
    ])
}

function packageSettings() {
    //Give the settings to the settings script
    settingsPanel.port.emit("onSettings", [
        ss.storage.followedStreamers,
        ss.storage.updateInterval,
        ss.storage.soundAlarm,
        ss.storage.alarmLimit,
        ss.storage.alarmLength,
        ss.storage.uniqueIds,
        ss.storage.streamIds,
        null,
        ss.storage.liveQuality,
        ss.storage.hideAvatar,
        ss.storage.hideOffline,
        ss.storage.sortMethod,
        ss.storage.openTab,
        ss.storage.openLive,
        ss.storage.openPopout,
        ss.storage.previewWait,
        ss.storage.tutorialOn,
        ss.storage.livePath,
        self.version,
        ss.storage.alarmInterval,
        ss.storage.restrictAlarm,
        ss.storage.restrictFrom,
        ss.storage.restrictTo,
        ss.storage.customAlarm,
        ss.storage.desktopNotifs,
        ss.storage.alarmVolume,
        ss.storage.hidePreview,
        ss.storage.darkMode
    ])
}

exports.onUnload = function(reason) {
    //console.log(reason)
    if ((reason == "disable") || (reason == "uninstall")) {
        //Reset all of the storage values

        //Followers
        delete ss.storage.followedStreamers

        //Alarm
        delete ss.storage.updateInterval
        delete ss.storage.desktopNotifs
        delete ss.storage.soundAlarm
        delete ss.storage.alarmVolume
        delete ss.storage.alarmInterval
        delete ss.storage.restrictAlarm
        delete ss.storage.restrictFrom
        delete ss.storage.restrictTo
        delete ss.storage.customAlarm
        delete ss.storage.alarmLimit
        delete ss.storage.alarmLength
        delete ss.storage.uniqueIds
        delete ss.storage.streamIds

        //Interface
        delete ss.storage.liveQuality
        delete ss.storage.livePath
        delete ss.storage.hideAvatar
        delete ss.storage.hideOffline
        delete ss.storage.hidePreview
        delete ss.storage.sortMethod
        delete ss.storage.openTab
        delete ss.storage.openLive
        delete ss.storage.openPopout
        delete ss.storage.previewWait
        delete ss.storage.tutorialOn
        delete ss.storage.darkMode

        //console.log("Good bye!")
    } else if (reason == "upgrade") {
        //Let's re-enable tutorials so they know the new features
        ss.storage.tutorialOn = true
    } else {
        //console.log("Good night!")
    }
}

function onOverQuota() {
    delete ss.storage.streamIds
    ss.storage.streamIds = []
}
ss.on("OverQuota", onOverQuota)

update_interval = setInterval(updateChannels, waittime * 1000)
updateChannels()