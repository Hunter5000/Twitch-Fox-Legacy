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
//Change default settings in SettingScript
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
    ss.storage.updateInterval = 1
}

if (ss.storage.desktopNotifs == null) {
    ss.storage.desktopNotifs = true
}

if (ss.storage.soundAlarm == null) {
    ss.storage.soundAlarm = true
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
if (ss.storage.debounce == null) {
    ss.storage.debounce = 40
}

//Interface
if (ss.storage.liveQuality == null) {
    ss.storage.liveQuality = "best"
}
if (ss.storage.livePath == null) {
    ss.storage.livePath = ""
}
if (ss.storage.hideInfo == null) {
    ss.storage.hideInfo = false
}
if (ss.storage.hideOffline == null) {
    ss.storage.hideOffline = false
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

var online_streamers = []
var online_games = []
var online_titles = []
var online_viewers = []
var online_avatars = []
var offline_streamers = []
var counter_names = []
var counter_nums = []
var counter_off = 0

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
var alarm_interval = null
var update_interval = null
var badge_timeout = null
var alarm_counter = 0

var httpHeaders = {
    'Accept': "application/vnd.twitchtv.v2+json",
    'Client-ID': "t163mfex6sggtq6ogh0fo8qcy9ybpd6"
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
    height: 500,
    onHide: handleHide
})

var settingsPanel = panels.Panel({
    contentURL: self.data.url("settings.html"),
    width: 665,
    height: 670,
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
    button.label = _("clickOpen_")
    panelOn = false
    button.state('window', {
        checked: false
    })
    if (alarmOn) {
        endAlarm()
    }
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

function playAlert() {
    button.badgeColor = "#FF0000"
    badge_timeout = setTimeout(resetBadgeColor, 250)

    var restricted = false
    if (ss.storage.restrictAlarm) {
        restricted = seeIfRestricted()
    }
    if ((ss.storage.soundAlarm) && (!restricted)) {
        if (ss.storage.customAlarm != "") {
            if ((ss.storage.customAlarm.search("http://") != -1) || (ss.storage.customAlarm.search("https://") != -1)) {
                pgworkr.Page({
                    contentScript: "new Audio('" + ss.storage.customAlarm + "').play()",
                    contentURL: blank
                })
            } else {
                var alarmpath1 = ss.storage.customAlarm.replace("\\", "\\\\")
                var alarmpath2 = OS.Path.toFileURI(alarmpath1)
                pgworkr.Page({
                    contentScript: "new Audio('" + alarmpath2 + "').play()",
                    contentURL: blank
                })
            }
        } else {
            pgworkr.Page({
                contentScript: "new Audio('alert2.ogg').play()",
                contentURL: blank
            })
        }
    }
    if (ss.storage.alarmLimit) {
        alarm_counter = alarm_counter + 1
        if (alarm_counter >= Math.ceil(ss.storage.alarmLength/ss.storage.alarmInterval)) {
            alarm_counter = 0
            endAlarm()
        }
    } else {
        alarm_counter = 0
    }
}

function genNotif(strname, game, title, avatar) {
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

function checkChannels(callbackFunc, favList) {
    for (var key in favList) {
        var request = Request({
            url: "https://api.twitch.tv/kraken/streams/" + favList[key],
            onComplete: callbackFunc,
            headers: httpHeaders
        })
        request.get()
    }
}

function checkChannel(callbackFunc, channel) {
    if (typeof(channel) != "string") {
        return
    }
    counter_off = counter_off + 1
    var request = Request({
        url: "https://api.twitch.tv/kraken/streams/" + channel + "?" + counter_off,
        onComplete: callbackFunc,
        headers: httpHeaders
    })
    request.get()
}

function getFollowedChannels(callbackFunc, name, offset) {
    var request = Request({
        url: "https://api.twitch.tv/kraken/users/" + name + "/follows/channels?offset=" + offset + "&limit=25&sortby=created_at&direction=DESC",
        onComplete: callbackFunc,
        headers: httpHeaders
    })
    request.get()
}

function importFollowers(name, offset) {
    //console.log("Importing followed channels from " + name + "...")
    getFollowedChannels(function(response) {
        if (response.json == null) {
            return
        }
        if (typeof response.json.status != 'undefined' && response.json.status != 200) {
            //console.error("Error: [" + response.json.status + "] " + response.json.message)
            return
        }
        var follows = response.json.follows
        for (var key in follows) {
            var item = follows[key]
            var channelName = item.channel.name
            if (!containsValue(ss.storage.followedStreamers, channelName)) {
                ss.storage.followedStreamers.push(channelName)
                packageSettings()
            }
        }
        // Get more if they exist
        //console.log("About to check for more followers: " + offset + "/" + response.json._total)
        if (response.json._total > (offset + 25)) {
            //console.log("Checking name " + name + " with offset " + offset)
            importFollowers(name, offset + 25)
        } else {
            //console.log("Import process complete")
            packageSettings()
        }
    }, name, offset)
}

//Now for my work...

function manageOnlineStreamers(remadd, name_, game_, title_, viewers_, avatar_) {
    //0 to remove, 1 to add, 2 to update
    if (remadd == 0) {
        var namekey = online_streamers.indexOf(name_)
        if (namekey > -1) {
            online_streamers.splice(namekey, 1)
            online_games.splice(namekey, 1)
            online_titles.splice(namekey, 1)
            online_viewers.splice(namekey, 1)
            online_avatars.splice(namekey, 1)
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
            if (game_ == null) {
                online_games.unshift("!null!")
            }
        }
    }
    if (remadd == 2) {
        var namekey = online_streamers.indexOf(name_)
        if (namekey > -1) {
            online_games[namekey] = game_
            online_titles[namekey] = title_
            online_viewers[namekey] = viewers_
            online_avatars[namekey] = avatar_
        }
    }
    if (panelOn) {
        panelUpdate()
    }
    //Let's update the panel too while we're changing values...
}

function counterTest(_name, _on) {
    if (_on) {
        var magicnum = Math.ceil(ss.storage.debounce / waittime)
        var nameindex = counter_names.indexOf(_name)
        counter_nums[nameindex] = (counter_nums[nameindex] + 1)
        console.log(_name, counter_nums[nameindex])
        if (counter_nums[nameindex] >= magicnum) {
            //Streamer is confirmed offline
            console.log(_name + " has been offline for enough consecutive time. Confirmed as offline.")
            manageOnlineStreamers(0, _name)
            counter_names.splice(nameindex, 1)
            counter_nums.splice(nameindex, 1)
        }
    } else {
        console.log(_name + " may have gone offline. Starting counter test...")
        counter_names.push(_name)
        counter_nums.push(0)
    }
}

function cleanOnlineStreamers() {
    for (var key in online_streamers) {
        checkChannel(function(response) {
            if (response.json != null) {
                var stream = response.json.stream
                var chann = response.json._links.self.split("/streams/")[1]
                var counterOn = containsValue(counter_names, chann)
                if (stream != null) {
                    if (!counterOn) {
                        //Streamer is online as normal
                        //Update
                        var strname = stream.channel.name
                        var game = stream.channel.game
                        var title = stream.channel.status
                        var viewers = stream.viewers
                        var avatar = stream.channel.logo
                        var namekey = online_streamers.indexOf(strname)
                        if ((game != online_games[namekey]) || (title != online_titles[namekey]) || (avatar != online_avatars[namekey]) || (viewers != online_viewers[namekey])) {
                            //Something has changed... time to update
                            if ((game != null)) {
                                manageOnlineStreamers(2, strname, game, title, viewers, avatar)
                            } else if (online_games[namekey] != "!null!") {
                                manageOnlineStreamers(2, strname, game, title, viewers, avatar)
                            }
                        }
                    } else {
                        //Stream has come back online
                        //Remove from counter system
                        console.log(chann + " has come back online. Confirmed as online.")

                        var countIndex = counter_names.indexOf(chann)
                        counter_names.splice(countIndex, 1)
                        counter_nums.splice(countIndex, 1)
                        addStrId(response.json.stream._id)

                        //Update
                        var strname = stream.channel.name
                        var game = stream.channel.game
                        var title = stream.channel.status
                        var viewers = stream.viewers
                        var avatar = stream.channel.logo
                        var namekey = online_streamers.indexOf(strname)
                        if ((game != online_games[namekey]) || (title != online_titles[namekey]) || (avatar != online_avatars[namekey]) || (viewers != online_viewers[namekey])) {
                            //Something has changed... time to update
                            manageOnlineStreamers(2, strname, game, title, viewers, avatar)
                        }
                    }
                } else {
                    //Stream cannot be found
                    counterTest(chann, counterOn)
                }
            } else {
                //Response cannot be found
                //This means that a streamer who was online got deleted... perhaps due to an admin shutdown?
                //We cannot be truly sure of who we're responding too... so run for the hills!
                forceRefresh()
            }
        }, online_streamers[key])
        if (!(containsValue(ss.storage.followedStreamers, online_streamers[key]))) {
            //Streamer has been unfollowed
            manageOnlineStreamers(0, online_streamers[key])
        }
    }
}

function checkStrId(id_) {
    if (!containsValue(ss.storage.streamIds, id_) || !ss.storage.uniqueIds) {
        return true
    } else {
        return false
    }
}

function addStrId(id_) {
    if (!containsValue(ss.storage.streamIds, id_)) {
        ss.storage.streamIds.push(id_)
    }
}

function updateChannels() {
    updateBadge()
    if (!(containsValue(ss.storage.followedStreamers, alarmCause)) && (alarmCause != "")) {
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
    offline_streamers = generateOfflineStreamers()
    checkChannels(function(response) {
        if (response.json != null) {
            var stream = response.json.stream
            if (stream != null) {
                var strname = stream.channel.name
                var game = stream.channel.game
                var title = stream.channel.status
                var viewers = stream.viewers
                var avatar = stream.channel.logo
                var strid = stream._id
                if ((containsValue(ss.storage.followedStreamers, strname)) && (!containsValue(online_streamers, strname))) {
                    //New streamer has come online
                    manageOnlineStreamers(1, strname, game, title, viewers, avatar)
                    if ((!alarmOn) && checkStrId(strid)) {
                        alarmOn = true
                        alarmCause = strname
                        if (ss.storage.desktopNotifs) {
                            genNotif(strname, game, title, avatar)
                        }
                        playAlert()
                        alarm_interval = setInterval(playAlert, ss.storage.alarmInterval * 1000) //this is the alarm part
                    }
                    if (panelOn) {
                        panelUpdate()
                    }
                    addStrId(strid)
                } else {
                    //Channel is not being followed
                }
            } else {
                //Offline streamer is still offline
            }
        } else {
            //Response not found
        }
    }, generateOfflineStreamers())
}

function generateOfflineStreamers() {
    var offstreamers = []
    for (var key in ss.storage.followedStreamers) {
        if (!(containsValue(online_streamers, ss.storage.followedStreamers[key]))) {
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
    offline_streamers = []
    counter_names = []
    counter_nums = []
}

panel.on("show", function() {
    //console.log("Shipping payload...")
    panelUpdate()
})

panel.port.on("openTab", function(payload) {
    tabs.open("http://www.twitch.tv/" + payload)
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
    ss.storage.debounce = payload[7]
    ss.storage.liveQuality = payload[8]
    ss.storage.hideInfo = payload[9]
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
})

settingsPanel.port.on("importUser", function(payload) {
    importFollowers(payload, 0)
})

settingsPanel.port.on("forceRefresh", function() {
    forceRefresh()
})

function endAlarm() {
    resetBadgeColor()
    if (alarm_interval != null) {
        clearInterval(alarm_interval)
        alarmOn = false
        alarmCause = ""
            //console.log("Alarm stopped")
    }
    if (panelOn) {
        panelUpdate()
    }
}

panel.port.on("endAlarm", function() {
    endAlarm()
})

preferences.on("settingsButton", function() {
    openSettings()
})

function panelUpdate() {
    //Should update when something has changed or alarm turns off
    //Give the settings to the panel
    offline_streamers = generateOfflineStreamers()
    panel.port.emit("updatePage", [
        online_streamers,
        online_games,
        online_titles,
        online_viewers,
        online_avatars,
        offline_streamers,
        alarmOn,
        ss.storage.followedStreamers,
        ss.storage.hideInfo,
        ss.storage.hideOffline,
        ss.storage.sortMethod,
        ss.storage.openTab,
        ss.storage.openLive,
        ss.storage.openPopout,
        ss.storage.previewWait,
        ss.storage.tutorialOn,
        alarmCause,
        liveerror,
        errorcause
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
        ss.storage.debounce,
        ss.storage.liveQuality,
        ss.storage.hideInfo,
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
        ss.storage.desktopNotifs
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
        delete ss.storage.alarmInterval
        delete ss.storage.restrictAlarm
        delete ss.storage.restrictFrom
        delete ss.storage.restrictTo
        delete ss.storage.customAlarm
        delete ss.storage.alarmLimit
        delete ss.storage.alarmLength
        delete ss.storage.uniqueIds
        delete ss.storage.streamIds
        delete ss.storage.debounce

        //Interface
        delete ss.storage.liveQuality
        delete ss.storage.livePath
        delete ss.storage.hideInfo
        delete ss.storage.hideOffline
        delete ss.storage.sortMethod
        delete ss.storage.openTab
        delete ss.storage.openLive
        delete ss.storage.openPopout
        delete ss.storage.previewWait
        delete ss.storage.tutorialOn

        //console.log("Good bye!")
    } else if (reason == "upgrade") {
        //Let's re-enable tutorials so they know the new features
        ss.storage.tutorialOn = true
    } else {
        //console.log("Good night!")
    }
}

function onOverQuota() {
    console.log("Over quota! Let's delete the most spacetaking yet most useless pieces of data.")
    delete ss.storage.streamIds
    ss.storage.streamIds = []
}
ss.on("OverQuota", onOverQuota)

update_interval = setInterval(updateChannels, waittime * 1000)
updateChannels()