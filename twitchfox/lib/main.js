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
var OAuth2 = require("./oauth2");

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

if (ss.storage.followedGames == null) {
    ss.storage.followedGames = []
}

if (ss.storage.mutedChannels == null) {
    ss.storage.mutedChannels = []
}

if (ss.storage.authInfo == null) {
    ss.storage.authInfo = ["", "", "", [],
        []
    ]
}

//Alarm
if (ss.storage.updateInterval == null) {
    ss.storage.updateInterval = 60
} else if (ss.storage.updateInterval < 60) {
    ss.storage.updateInterval = 60
}

if (ss.storage.alertOn == null) {
    ss.storage.alertOn = true
}

if (ss.storage.alertChange == null) {
    ss.storage.alertChange = false
}

if (ss.storage.alertOff == null) {
    ss.storage.alertOff = false
}

if (ss.storage.alertGames == null) {
    ss.storage.alertGames = false
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

var onlineInfo = []
var onlineInfoS = []
var gameInfo = []
var gameInfoS = []
var offlineGames = []

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
var searchedChannel = false
var panelMode = 0
var topGames = []
var topStreams = []
var srchoff = 0
var srchoff2 = 0
var scrollers = [false, false]
var scrollers2 = [false, false, true]
var lastSearch = [0, null]

function arrayDiff(a, b) {
    a = a == null ? [] : a
    b = b == null ? [] : b
    return a.filter(function(i) {
        return b.indexOf(i) < 0
    })
}

var twitchOauth = OAuth2.addAdapter({
    id: 'twitch',
    codeflow: {
        method: "POST",
        url: "https://api.twitch.tv/kraken/oauth2/token"
    },
    opts: {
        api: "https://api.twitch.tv/kraken/oauth2/authorize",
        response_type: 'token',
        client_id: 'dzawctbciav48ou6hyv0sxbgflvfdpp',
        client_secret: 'b1smws17iv8ob4wpbi4671mf6ceus3r',
        scope: 'user_follows_edit user_read',
        redirect_uri: 'https://hunter5000.github.io/twitchfox.html'
    }
});

//0=names,1=display names,2=games,3=statuses,4=logos,5=viewers,6=times

function getPlace(ar, n, q) {
    var output = 0
    for (var key in ar) {
        if (ar[key][n] == q) {
            output = key
            break
        }
    }
    return output
}

function infoGet(ar, n) {
    var output = []
    for (var key in ar) {
        output.push(ar[key][n])
    }
    return output
}

function sortByN(ar, n, r) {
    var sortf = ar.sort(function(a, b) {
        if (a[n] < b[n]) return -1;
        if (a[n] > b[n]) return 1;
        return 0;
    })
    return r ? sortf.reverse() : sortf
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

var alarm_script = pgworkr.Page({
    contentScriptFile: self.data.url("alarm.js"),
    contentURL: blank
})

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

function login() {
    panel.hide()
    twitchOauth.authorize(function() {
        //We have obtained a token, or at least a response
        ss.storage.authInfo = ["", "", "", [],
            []
        ]
        var response = twitchOauth.getAccessToken()
        if (response != "") {
            ss.storage.authInfo[0] = response
            authUpdate()
        }
    })
}

function logout() {
    //Logging out is much easier than logging in
    twitchOauth.clearAccessToken();
    delete ss.storage.authInfo
    ss.storage.authInfo = ["", "", "", [],
        []
    ]
    onlineInfo = []
    panel.port.emit("authEnd")
    authUpdate()
}

panel.port.on("login", login)

panel.port.on("logout", logout)

panel.port.on("openProfile", function() {
    if (ss.storage.authInfo[0] != "") {
        tabs.open("http://www.twitch.tv/" + ss.storage.authInfo[1] + "/profile")
    }
})

function authUpdate() {
    //AuthInfo = Token, Name, Display name, Followed channels, Followed games
    if (ss.storage.authInfo[0] != "") {
        getUser(function(response) {
            if (response.json != null) {
                if (((response.json.error != null) ? response.json.error : false) == "Unauthorized") {
                    logout();
                    return
                }
                ss.storage.authInfo[1] = response.json.name
                ss.storage.authInfo[2] = response.json.display_name
                authFollowers(0, [], true)
            }
        })
    } else {
        updateChannels()
    }
}

var settingsPanel = panels.Panel({
    contentURL: self.data.url("settings.html"),
    width: 720,
    height: 735
        //onHide: handleHide
})

function openSettings() {
    packageSettings()
    settingsPanel.show({})
}

function insSeparators(num) {
    if (num != null) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, _("separator_"));
    }
}

function nameGames() {
    var sortf = []
    var sortf2 = []
    var tempNameGames = []
    var tempGames = []
    if (ss.storage.sortMethod == "viewers") {
        sortf = sortByN(onlineInfo, 5, true)
    } else if (ss.storage.sortMethod == "recent") {
        sortf = sortByN(onlineInfo, 6, true)
    } else if (ss.storage.sortMethod == "alpha") {
        sortf = sortByN(onlineInfo, 0)
    }
    sortf2 = sortByN(gameInfo, 3, true)
    for (var key in sortf) {
        if ((sortf[key][2] != "!null!") && (cleanse(sortf[key][2]) != "")) {
            tempNameGames.push(sortf[key][1] + " | " + sortf[key][2])
        } else {
            tempNameGames.push(sortf[key][1])
        }
    }
    for (var key in sortf2) {
        if ((cleanse(sortf2[key][0]) != "") && (sortf2[key][4] > 0)) {
            tempGames.push(sortf2[key][0] + " | " + insSeparators(sortf2[key][3]))
        }
    }
    onlineInfoS = sortf
    gameInfoS = sortf2
    if (panelOn) {
        panelUpdate()
    }
    return [tempNameGames, tempGames]
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
    updateBadge()
    panelOn = false
    button.state('window', {
        checked: false
    })
}

function updateBadge() {
    button.badge = null
    var ngames = nameGames()
    var str1 = ""
    var str2 = ""
    if (onlineInfo.length > 0) {
        button.badge = onlineInfo.length
        str1 = "\n\n" + ngames[0].join("\n")
    }
    if (gameInfo.length > offlineGames.length) {
        str2 = "\n\n" + ngames[1].join("\n")
    }
    button.label = (_("clickOpen_") + str1 + str2)
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
    return (restrictTo <= restrictFrom) ? ((curTime >= restrictFrom) || (curTime <= restrictTo)) : ((curTime >= restrictFrom) && (curTime <= restrictTo))
}

function manageAlert(bool) {
    if (bool && (!alarmOn)) {
        alarmOn = true
        badge_interval = setInterval(flashBadge, ss.storage.alarmInterval * 1000)
        var restricted = false
        if (panelOn) {
            panelUpdate()
        }
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
                }
            } else {
                alarm_script.port.emit("startAlarm", [
                    ss.storage.alarmInterval,
                    2,
                    ss.storage.alarmVolume,
                    null,
                    null
                ])
            }
        }
        if (ss.storage.alarmLimit) {
            setInterval(countAlarm, 1000)
        } else {
            alarm_counter = 0
        }
    } else if (!bool && alarmOn) {
        alarmCause = ""
        alarm_script.port.emit("stopAlarm")
        clearInterval(countAlarm)
        alarm_counter = 0
        clearInterval(badge_interval)
        resetBadgeColor()
        alarmOn = false
            //console.log("Alarm stopped")
        if (panelOn) {
            panelUpdate()
        }
    }
}

function genNotif(display_name, game, status, logo, typ) {
    if (logo == "!null!") {
        logo = "http://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_150x150.png"
    }
    if (game == "!null!") {
        game = ""
    }
    var stat = ""
    var txt = ""
    if (typ == 0) {
        stat = display_name + " " + _("hasCome_") + " " + game
        txt = '"' + status + '"' + "\n\n" + _("clickHere_")
    } else if (typ == 1) {
        stat = display_name + " " + _("hasChanged_")
        txt = '"' + status + '"' + "\n\n" + _("clickHere_")
    } else if (typ == 2) {
        stat = display_name + " " + _("hasOffline_")
    } else if (typ == 3) {
        stat = game + " " + _("gameOnline_")
        txt = _("clickHere_")
    }
    notifications.notify({
        title: stat,
        text: txt,
        iconURL: logo,
        onClick: function() {
            if (typ != 3) {
                var active = utils.getMostRecentBrowserWindow();
                active.focus()
                changeMode(0)
                panelUpdate()
                panelOn = true
                panel.show({
                    position: button
                })
            } else {
                var active = utils.getMostRecentBrowserWindow();
                active.focus()
                changeMode(1)
                panelUpdate()
                panelOn = true
                panel.show({
                    position: button
                })
            }
        }
    })
}

function containsValue(list, obj) {
    return ((list.indexOf(obj)) > -1)
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
    currentResolution = (streamResolution === undefined) ? ((ss.storage.liveQuality === undefined) ? "best" : ss.storage.liveQuality) : streamResolution
        // Main
    args = [currentURL, currentResolution]
    return args
}

// Run Livestreamer

function getLivestreamerValidation(url) {
    var qualPattern1 = ['best', 'source', 'worst', 'audio']
    var go_ = true
    for (var key in qualPattern1) {
        if (ss.storage.liveQuality == qualPattern1[key]) {
            runLivestreamer(buildArgs(url, ss.storage.liveQuality))
            go_ = false
        }
    }
    if (go_) {
        var path,
            process,
            livestreamer,
            jsonData = '',
            ls,
            quality,
            qualityPattern = ['best', 'source', 'live', '2160p', '1440p', '1080p+', '1080p', 'ultra', 'high', '720p+', '720p', 'medium', 'mid', '480p+', '480p', 'low', '360p+', '360p', '240p', '144p', 'mobile', 'worst', 'audio'],
            results = [],
            i;
        // Get livestreamer path
        path = getLivestreamerPath();
        // Kill if null
        if (path === null) {
            return;
        }
        // Create child instance
        process = require("sdk/system/child_process");
        // Spawn a seperate child to validate in Livestreamer
        livestreamer = process.spawn(path, ["--json", url]);
        // As the stream comes in, grab the data
        livestreamer.stdout.on('data', function(data) {
            // Save the data to one global variable
            jsonData += data;
        });
        // When stream capture is finished, sent emit
        livestreamer.on("exit", function() {
            // Convert string to JSON
            ls = JSON.parse(jsonData);
            // Is the url live?
            if (!ls.hasOwnProperty('error')) {
                // Capture quality
                quality = Object.keys(ls.streams);
                // Sort
                for (i = 0; i < qualityPattern.length; i++) {
                    if (containsValue(quality, qualityPattern[i])) {
                        results.push(qualityPattern[i]);
                    }
                }
                // Add left over qualiies
                for (i = 0; i < quality.length; i++) {
                    if (!containsValue(results, quality[i])) {
                        results.push(quality[i]);
                    }
                }
                // Results
                var newqual = ss.storage.liveQuality
                if (results.length > 0 && (!containsValue(results, ss.storage.liveQuality))) {
                    newqual = results[0]
                }
                runLivestreamer(buildArgs(url, newqual))
            }
        });
    }
}

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
        if (panelOn) {
            panelUpdate()
        }
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
        return (patherror) ? "!error!" : ((file.exists()) ? path : "error")
    }
}

function httpHeaders() {
    return (ss.storage.authInfo[0] != "") ? {
        'Accept': "application/vnd.twitchtv.v3+json",
        'Client-ID': "dzawctbciav48ou6hyv0sxbgflvfdpp",
        'Authorization': 'OAuth ' + ss.storage.authInfo[0]
    } : {
        'Accept': "application/vnd.twitchtv.v3+json",
        'Client-ID': "dzawctbciav48ou6hyv0sxbgflvfdpp",
    }
}

function followChannel(callbackFunc, channel) {
    var request = Request({
        url: "https://api.twitch.tv/kraken/users/" + ss.storage.authInfo[1] + "/follows/channels/" + channel,
        onComplete: callbackFunc,
        headers: httpHeaders()
    })
    request["put"]()
}

function unfollowChannel(callbackFunc, channel) {
    var request = Request({
        url: "https://api.twitch.tv/kraken/users/" + ss.storage.authInfo[1] + "/follows/channels/" + channel,
        onComplete: callbackFunc,
        headers: httpHeaders()
    })
    request["delete"]()
}

function followGame(callbackFunc, game) {
    var request = Request({
        url: "http://api.twitch.tv/api/users/" + ss.storage.authInfo[1] + "/follows/games/" + game,
        onComplete: callbackFunc,
        headers: httpHeaders()
    })
    request["put"]()
}

function unfollowGame(callbackFunc, game) {
    var request = Request({
        url: "http://api.twitch.tv/api/users/" + ss.storage.authInfo[1] + "/follows/games/" + game,
        onComplete: callbackFunc,
        headers: httpHeaders()
    })
    request["delete"]()
}

function getUser(callbackFunc) {
    var request = Request({
        url: "https://api.twitch.tv/kraken/user",
        onComplete: callbackFunc,
        headers: httpHeaders()
    })
    request.get()
}

function getChannel(callbackFunc, channel) {
    var request = Request({
        url: "https://api.twitch.tv/kraken/channels/" + channel,
        onComplete: callbackFunc,
        headers: httpHeaders()
    })
    request.get()
}

function checkStreams(callbackFunc, list, offset) {
    var liststr = list.join(",")
    if (liststr == "") {
        liststr = "!"
    }
    var request = Request({
        url: "https://api.twitch.tv/kraken/streams?limit=100&offset=" + offset + "&channel=" + liststr,
        onComplete: callbackFunc,
        headers: httpHeaders()
    })
    request.get()
}

function searchStreams(callbackFunc, srch, offset) {
    var request = Request({
        url: "https://api.twitch.tv/kraken/search/streams?limit=20&offset=" + offset + "&q=" + srch,
        onComplete: callbackFunc,
        headers: httpHeaders()
    })
    request.get()
}

function searchChannels(callbackFunc, srch, offset) {
    var request = Request({
        url: "https://api.twitch.tv/kraken/search/channels?limit=20&offset=" + offset + "&q=" + srch,
        onComplete: callbackFunc,
        headers: httpHeaders()
    })
    request.get()
}

function searchGames(callbackFunc, srch) {
    var request = Request({
        url: "https://api.twitch.tv/kraken/search/games?q=" + srch + "&type=suggest",
        onComplete: callbackFunc,
        headers: httpHeaders()
    })
    request.get()
}

function searchLiveGames(callbackFunc, srch) {
    var request = Request({
        url: "https://api.twitch.tv/kraken/search/games?q=" + srch + "&type=suggest&live=true",
        onComplete: callbackFunc,
        headers: httpHeaders()
    })
    request.get()
}

function findTopGames(callbackFunc, offset) {
    var request = Request({
        url: "https://api.twitch.tv/kraken/games/top?limit=20&offset=" + offset,
        onComplete: callbackFunc,
        headers: httpHeaders()
    })
    request.get()
}

function findTopStreams(callbackFunc, offset) {
    var request = Request({
        url: "https://api.twitch.tv/kraken/streams?limit=20&offset=" + offset,
        onComplete: callbackFunc,
        headers: httpHeaders()
    })
    request.get()
}

function searchGame(callbackFunc, game, offset) {
    var request = Request({
        url: "https://api.twitch.tv/kraken/streams?limit=20&offset=" + offset + "&game=" + game,
        onComplete: callbackFunc,
        headers: httpHeaders()
    })
    request.get()
}

function gameSummary(callbackFunc, game) {
    var request = Request({
        url: "https://api.twitch.tv/kraken/streams/summary?game=" + game,
        onComplete: callbackFunc,
        headers: httpHeaders()
    })
    request.get()
}

function getFollowedChannels(callbackFunc, name, offset) {
    var request = Request({
        url: "https://api.twitch.tv/kraken/users/" + name + "/follows/channels?offset=" + offset + "&limit=100&sortby=created_at&direction=DESC",
        onComplete: callbackFunc,
        headers: httpHeaders()
    })
    request.get()
}

function getFollowedGames(callbackFunc, name, offset) {
    var request = Request({
        url: "https://api.twitch.tv/api/users/" + name + "/follows/games?offset=" + offset + "&limit=100&sortby=created_at&direction=DESC",
        onComplete: callbackFunc,
        headers: httpHeaders()
    })
    request.get()
}

function getFollowedStreams(callbackFunc, offset) {
    var request = Request({
        url: "https://api.twitch.tv/kraken/streams/followed?limit=100&offset=" + offset + "&stream_type=all",
        onComplete: callbackFunc,
        headers: httpHeaders()
    })
    request.get()
}



function importFollowers(name, offset, recorded) {
    //console.log("Importing followed channels from " + name + "...")
    var rec = recorded
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
            rec.push(channelName)
        }
        // Get more if they exist
        //console.log("About to check for more followers: " + offset + "/" + response.json._total)
        if (response.json._total > (offset + 100)) {
            //console.log("Checking name " + name + " with offset " + offset)
            importFollowers(name, offset + 100, recorded)
        } else {
            //console.log("Import process complete")
            //Add channels that didn't exist before
            var dif1 = arrayDiff(rec, ss.storage.followedStreamers)
            for (var key in dif1) {
                if (!containsValue(ss.storage.followedStreamers, dif1[key]) && typeof(dif1[key] == "string")) {
                    ss.storage.followedStreamers.push(dif1[key])
                }
            }
            packageSettings()
            importGames(name, 0, [])
            updateChannels()
        }
    }, name, offset)
}

function importGames(name, offset, recorded) {
    //console.log("Importing followed channels from " + name + "...")
    var rec = recorded
    getFollowedGames(function(response) {
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
            var name = item.name
            rec.push(name)
        }
        // Get more if they exist
        //console.log("About to check for more followers: " + offset + "/" + response.json._total)
        if (response.json._total > (offset + 100)) {
            //console.log("Checking name " + name + " with offset " + offset)
            importGames(name, offset + 100, rec)
        } else {
            //Add games that didn't exist before
            var dif1 = arrayDiff(rec, ss.storage.followedGames)
            for (var key in dif1) {
                if (!containsValue(ss.storage.followedGames, dif1[key]) && typeof(dif1[key] == "string")) {
                    ss.storage.followedGames.push(dif1[key])
                }
            }
            genGameInfo()
            packageSettings()
        }
    }, name, offset)
}

function authFollowers(offset, recorded, contin) {
    if (ss.storage.authInfo[0] == "") {
        updateChannels()
    } else {
        var rec = recorded
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
                rec.push(channelName)
            }
            // Get more if they exist
            //console.log("About to check for more followers: " + offset + "/" + response.json._total)
            if (response.json._total > (offset + 100)) {
                //console.log("Checking name " + name + " with offset " + offset)
                authFollowers(offset + 100, rec, contin)
            } else {
                //Remove channels that no longer exist
                var dif2 = arrayDiff(ss.storage.authInfo[3], rec)
                for (var key in dif2) {
                    if (containsValue(ss.storage.authInfo[3], dif2[key]) && typeof(dif2[key] == "string")) {
                        ss.storage.authInfo[3].splice(ss.storage.authInfo[4].indexOf(dif2[key]), 1)
                        panel.port.emit("authEnd")
                    }
                }
                //Add channels that didn't exist before
                var dif1 = arrayDiff(rec, ss.storage.authInfo[3])
                for (var key in dif1) {
                    if (!containsValue(ss.storage.authInfo[3], dif1[key]) && typeof(dif1[key] == "string")) {
                        ss.storage.authInfo[3].push(dif1[key])
                        panel.port.emit("authEnd")
                    }
                }
                updateChannels()
                if (contin) {
                    authGames(0, [])
                }
            }
        }, ss.storage.authInfo[1], offset)
    }
}

function authGames(offset, recorded) {
    if (ss.storage.authInfo[0] == "") {
        genGameInfo()
    } else {
        var rec = recorded
        getFollowedGames(function(response) {
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
                var name = item.name
                rec.push(name)
            }
            // Get more if they exist
            //console.log("About to check for more followers: " + offset + "/" + response.json._total)
            if (response.json._total > (offset + 100)) {
                //console.log("Checking name " + name + " with offset " + offset)
                authGames(offset + 100, rec)
            } else {
                //Remove games that no longer exist
                var dif2 = arrayDiff(ss.storage.authInfo[4], rec)
                for (var key in dif2) {
                    if (containsValue(ss.storage.authInfo[4], dif2[key]) && typeof(dif2[key] == "string")) {
                        ss.storage.authInfo[4].splice(ss.storage.authInfo[4].indexOf(dif2[key]), 1)
                        panel.port.emit("authEnd")
                    }
                }
                //Add games that didn't exist before
                var dif1 = arrayDiff(rec, ss.storage.authInfo[4])
                for (var key in dif1) {
                    if (!containsValue(ss.storage.authInfo[4], dif1[key]) && typeof(dif1[key] == "string")) {
                        ss.storage.authInfo[4].push(dif1[key])
                        panel.port.emit("authEnd")
                    }
                }
                genGameInfo()
            }
        }, ss.storage.authInfo[1], offset)
    }
}

function checkStrId(id_) {
    return (!containsValue(ss.storage.streamIds, id_) || !ss.storage.uniqueIds)
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
        ss.storage.streamIds = []
    }

}

function streamsResponse(response, offs) {
    if (response.json != null) {
        if (response.json.error != null) {
            var msg = response.json.message
            var name = msg.split("'")[1]
            var namekey = ss.storage.followedStreamers.indexOf(name)
                //ss.storage.followedStreamers.splice(name, 1)
        } else {
            var streams = response.json.streams
            var curOn = []
            if (streams != null) {
                for (var key in streams) {
                    var stream = streams[key]
                        //Now online
                    var name = stream.channel.name
                    var display_name = stream.channel.display_name
                    curOn.push(name)
                    var game = stream.channel.game
                    if (game == null) {
                        game = "!null!"
                    }
                    var status = stream.channel.status
                    var viewers = stream.viewers
                    var logo = stream.channel.logo
                    if (logo == null) {
                        logo = "!null!"
                    }
                    var time = stream.created_at
                    var strid = stream._id
                    if (!containsValue(infoGet(onlineInfo, 0), name)) {
                        //Was offline, now online
                        onlineInfo.push([name, display_name, game, status, logo, viewers, genTime(time)])
                        if ((!alarmOn) && checkStrId(strid) && (ss.storage.alertOn) && (!containsValue(ss.storage.mutedChannels, name))) {
                            if (ss.storage.desktopNotifs) {
                                genNotif(display_name, game, status, logo, 0)
                            }
                            alarmCause = name
                            manageAlert(true)
                        }
                        addStrId(strid)
                        updateBadge()
                    } else {
                        //Was online, still online
                        var namekey = getPlace(onlineInfo, 0, name)
                            //Update: Game, Status, Logo, Viewers, Time
                            //0=names,1=display names,2=games,3=statuses,4=logos,5=viewers,6=times
                        if (status != onlineInfo[namekey][3]) {
                            if ((!alarmOn) && (ss.storage.alertChange) && (!containsValue(ss.storage.mutedChannels, name))) {
                                if (ss.storage.desktopNotifs) {
                                    genNotif(display_name, game, status, logo, 1)
                                }
                                alarmCause = name
                                manageAlert(true)
                            }
                        }
                        if ((display_name != onlineInfo[namekey][1]) || (game != onlineInfo[namekey][2]) || (status != onlineInfo[namekey][3]) || (logo != onlineInfo[namekey][4]) || (viewers != onlineInfo[namekey][5]) || (genTime(time) != onlineInfo[namekey][6])) {
                            //Something has changed... time to update
                            onlineInfo[namekey][1] = display_name
                            onlineInfo[namekey][2] = game
                            onlineInfo[namekey][3] = status
                            onlineInfo[namekey][4] = logo
                            onlineInfo[namekey][5] = viewers
                            onlineInfo[namekey][6] = genTime(time)
                        }
                        updateBadge()
                    }
                }
            }
            tempOn = infoGet(onlineInfo, 0)
            for (var key in tempOn) {
                var curOff = !containsValue(curOn, tempOn[key])
                if (curOff) {
                    if ((!alarmOn) && checkStrId(strid) && (ss.storage.alertOff) && (!containsValue(ss.storage.mutedChannels, name))) {
                        if (ss.storage.desktopNotifs) {
                            var display_name = infoGet(onlineInfo, 1)[key]
                            var game = infoGet(onlineInfo, 2)[key]
                            var status = infoGet(onlineInfo, 3)[key]
                            var logo = infoGet(onlineInfo, 4)[key]
                            genNotif(display_name, game, status, logo, 2)
                        }
                        alarmCause = name
                        manageAlert(true)
                    }
                    onlineInfo.splice(key, 1)
                    updateBadge()
                }
            }
        }
        if (response.json._total > (offs + 100)) {
            updateChannels(offs + 100)
        }
    } else {
        //Response not found
    }
}


function updateChannels(offset) {
    var offs = 0
    if (offset) {
        offs = offset
    }
    var followedStreamers = ss.storage.authInfo[0] != "" ? ss.storage.authInfo[3] : ss.storage.followedStreamers
    if (!(containsValue(followedStreamers, alarmCause)) && (alarmCause != "")) {
        //console.log("Alarm cause is no longer being followed")
        manageAlert(false)
    }
    if (containsValue(ss.storage.mutedChannels, alarmCause)) {
        //console.log("Alarm cause is now muted")
        manageAlert(false)
    }
    var tempOn = infoGet(onlineInfo, 0)
    if (!ss.storage.alertOff) {
        if (!(containsValue(tempOn, alarmCause)) && (alarmCause != "")) {
            //console.log("Alarm cause is no longer online")
            manageAlert(false)
        }
    }
    var tempOnInfo = onlineInfo.slice()
    for (var key in tempOnInfo) {
        if (!containsValue(followedStreamers, tempOnInfo[key][0])) {
            //console.log("Online channel has been unfollowed")
            onlineInfo.splice(onlineInfo.indexOf(tempOnInfo[key][0]), 1)
            updateBadge()
        }
    }
    if (!alarmOn) {
        clearInterval(countAlarm)
        alarm_counter = 0
        clearInterval(badge_interval)
        resetBadgeColor()
        alarmCause = ""
    }
    if (offs == 0 && ss.storage.alertGames) {
        genGameInfo()
    }
    if (ss.storage.authInfo[0] != "") {
        getFollowedStreams(function(response) {
            streamsResponse(response, offs)
        }, offs)
    } else {
        checkStreams(function(response) {
            streamsResponse(response, offs)
        }, ss.storage.followedStreamers, offs)
    }
    updateBadge()
}


function generateOfflineStreamers() {
    var tempOn = infoGet(onlineInfo, 0)
    var off = []
    var followedStreamers = ss.storage.authInfo[0] != "" ? ss.storage.authInfo[3] : ss.storage.followedStreamers
    for (var key in followedStreamers) {
        if (!(containsValue(tempOn, followedStreamers[key]))) {
            off.push(followedStreamers[key])
        }
    }
    off = off.sort()
    return off
}

function forceRefresh(payload) {
    if (!payload) {
        if (panelMode == 0) {
            onlineInfo = []
            onlineInfoS = []
            updateBadge()
            authFollowers(0, [])
        } else if (panelMode == 1) {
            topGames = []
            gameInfo = []
            gameInfoS = []
            updateBadge()
            authGames(0, [])
            getTopGames()
        } else if (panelMode == 2) {
            topStreams = []
            if (panelOn) {
                panelUpdate()
            }
            getTopStreams()
        }
    } else {
        if (lastSearch[0] == 0) {
            searchTwitch(lastSearch[1])
        } else if (lastSearch[0] == 1) {
            searchTwitch2(lastSearch[1])
        } else if (lastSearch[0] == 2) {
            searchTwitch3(lastSearch[1])
        } else if (lastSearch[0] == 3) {
            searchTwitch4(lastSearch[1])
        }
    }
}

panel.on("show", function() {
    //console.log("Shipping payload...")
    panelUpdate()
})

panel.port.on("openTab", function(payload) {
    tabs.open("http://www.twitch.tv/" + payload)
})

function follow(channel) {
    var followedStreamers = ss.storage.authInfo[0] != "" ? ss.storage.authInfo[3] : ss.storage.followedStreamers
    if (!(containsValue(followedStreamers, channel))) {
        getChannel(function(response) {
            var err = (response.json.error != null) ? response.json.error : false
            if (!err) {
                if (ss.storage.authInfo[0] == "") {
                    ss.storage.followedStreamers.unshift(channel)
                    updateChannels()
                    packageSettings()
                } else {
                    followChannel(function(response) {
                        if (response.json == null) {
                            return
                        }
                        if (((response.json.error != null) ? response.json.error : false) == "Unauthorized") {
                            logout();
                            return
                        }
                        panel.port.emit("authStart")
                        authFollowers(0, [])
                    }, channel)
                }
            }
        }, channel)
    }
}

function unfollow(channel) {
    var followedStreamers = ss.storage.authInfo[0] != "" ? ss.storage.authInfo[3] : ss.storage.followedStreamers
    if (containsValue(followedStreamers, channel)) {
        if (ss.storage.authInfo[0] == "") {
            var namekey = ss.storage.followedStreamers.indexOf(channel)
            ss.storage.followedStreamers.splice(namekey, 1)
            updateChannels()
            packageSettings()
        } else {
            unfollowChannel(function(response) {
                panel.port.emit("authStart")
                authFollowers(0, [])
                if (response.json == null) {
                    return
                }
                if (((response.json.error != null) ? response.json.error : false) == "Unauthorized") {
                    logout();
                    return
                }
            }, channel)
        }
    }
}

panel.port.on("follow", follow)
panel.port.on("unfollow", unfollow)

settingsPanel.port.on("follow", follow)
settingsPanel.port.on("unfollow", unfollow)


function follow2(game) {
    var followedGames = ss.storage.authInfo[0] != "" ? ss.storage.authInfo[4] : ss.storage.followedGames
    if (!(containsValue(followedGames, game))) {
        if (ss.storage.authInfo[0] == "") {
            ss.storage.followedGames.unshift(game)
            genGameInfo()
            packageSettings()
        } else {
            followGame(function(response) {
                if (response.json == null) {
                    return
                }
                if (((response.json.error != null) ? response.json.error : false) == "Unauthorized") {
                    logout();
                    return
                }
                panel.port.emit("authStart")
                authGames(0, [])
            }, game)
        }
    }
}

function unfollow2(game) {
    var followedGames = ss.storage.authInfo[0] != "" ? ss.storage.authInfo[4] : ss.storage.followedGames
    if ((containsValue(followedGames, game))) {
        if (ss.storage.authInfo[0] == "") {
            var namekey = ss.storage.followedGames.indexOf(game)
            ss.storage.followedGames.splice(namekey, 1)
            genGameInfo()
            packageSettings()
        } else {
            unfollowGame(function(response) {
                panel.port.emit("authStart")
                authGames(0, [])
                if (response.json == null) {
                    return
                }
                if (((response.json.error != null) ? response.json.error : false) == "Unauthorized") {
                    logout();
                    return
                }
            }, game)
        }
    }
}

panel.port.on("follow2", follow2)
panel.port.on("unfollow2", unfollow2)

settingsPanel.port.on("follow2", follow)
settingsPanel.port.on("unfollow2", unfollow)

panel.port.on("mute", function(payload) {
    var newname = payload
    if (!containsValue(ss.storage.mutedChannels, newname)) {
        ss.storage.mutedChannels.unshift(newname)
        if (panelOn) {
            panelUpdate()
        }
    }
})

panel.port.on("unmute", function(payload) {
    var newname = payload
    if (containsValue(ss.storage.mutedChannels, newname)) {
        var namekey = ss.storage.mutedChannels.indexOf(newname)
        ss.storage.mutedChannels.splice(namekey, 1)
        if (panelOn) {
            panelUpdate()
        }
    }
})

panel.port.on("follow2", function(payload) {
    var newname = payload
    if (!(containsValue(ss.storage.followedGames, newname))) {
        ss.storage.followedGames.unshift(newname)
        genGameInfo()
    }
})

panel.port.on("unfollow2", function(payload) {
    var newname = payload
    if (containsValue(ss.storage.followedGames, newname)) {
        console.log("Yes")
        var namekey = ss.storage.followedGames.indexOf(newname)
            //console.log("Removing due to unfollow")
        ss.storage.followedGames.splice(namekey, 1)
        if (containsValue(offlineGames, newname)) {
            var namekey2 = ss.storage.followedGames.indexOf(newname)
            offlineGames.splice(namekey2, 1)
        }
        genGameInfo()
    }
})

settingsPanel.port.on("importFromFile", function(payload) {
    if (ss.storage.authInfo[0] != "") {
        return
    }
    //Channels
    var dif2 = arrayDiff(ss.storage.followedStreamers, payload[0])
    for (var key in dif2) {
        if (containsValue(ss.storage.followedStreamers, dif2[key]) && typeof(dif2[key] == "string")) {
            ss.storage.followedStreamers.splice(ss.storage.followedStreamers.indexOf(dif2[key]))
            if (containsValue(ss.storage.mutedChannels, dif2[key])) {
                ss.storage.mutedChannels.splice(ss.storage.mutedChannels.indexOf(dif2[key]), 1)
            }
        }
    }
    var dif1 = arrayDiff(payload[0], ss.storage.followedStreamers)
    for (var key in dif1) {
        if (!containsValue(ss.storage.followedStreamers, dif1[key]) && typeof(dif1[key] == "string")) {
            ss.storage.followedStreamers.unshift(dif1[key])
            if (containsValue(payload[1], dif1[key]) && !containsValue(ss.storage.mutedChannels, dif1[key])) {
                ss.storage.mutedChannels.push(dif1[key])
            }
            if (!containsValue(payload[1], dif1[key]) && containsValue(ss.storage.mutedChannels, dif1[key])) {
                ss.storage.mutedChannels.splice(ss.storage.mutedChannels.indexOf(dif1[key]), 1)
            }
        }
    }
    //Games
    var dif4 = arrayDiff(ss.storage.followedGames, payload[2])
    for (var key in dif4) {
        if (containsValue(ss.storage.followedGames, dif4[key]) && typeof(dif4[key] == "string")) {
            ss.storage.followedGames.splice(ss.storage.followedGames.indexOf(dif4[key]))
        }
    }
    var dif3 = arrayDiff(payload[2], ss.storage.followedGames)
    for (var key in dif3) {
        if (!containsValue(ss.storage.followedGames, dif3[key]) && typeof(dif3[key] == "string")) {
            ss.storage.followedGames.unshift(dif3[key])
        }
    }
    updateChannels()
    genGameInfo()
})

panel.port.on("openLive", function(payload) {
    errorcause = payload
    getLivestreamerValidation("http://www.twitch.tv/" + payload)
})

panel.port.on("openSettings", function(payload) {
    openSettings()
})

settingsPanel.port.on("updateChans", function() {
    updateChannels()
})

settingsPanel.port.on("importSettings", function(payload) {
    //Retrieve setting updates
    ss.storage.updateInterval = payload[0]
    ss.storage.soundAlarm = payload[1]
    ss.storage.alarmLimit = payload[2]
    ss.storage.alarmLength = payload[3]
    ss.storage.uniqueIds = payload[4]
    ss.storage.streamIds = payload[5]
    ss.storage.darkMode = payload[6]
    ss.storage.liveQuality = payload[7]
    ss.storage.hideAvatar = payload[8]
    ss.storage.hideOffline = payload[9]
    ss.storage.sortMethod = payload[11]
    if (payload[10] != ss.storage.sortMethod) {
        ss.storage.sortMethod = payload[10]
        updateBadge()
    } else {
        ss.storage.sortMethod = payload[10]
    }
    ss.storage.openTab = payload[11]
    ss.storage.openLive = payload[12]
    ss.storage.openPopout = payload[13]
    ss.storage.previewWait = payload[14]
    ss.storage.tutorialOn = payload[15]
    ss.storage.livePath = payload[16]
    ss.storage.alarmInterval = payload[17]
    ss.storage.restrictAlarm = payload[18]
    ss.storage.restrictFrom = payload[19]
    ss.storage.restrictTo = payload[20]
    ss.storage.customAlarm = payload[21]
    ss.storage.desktopNotifs = payload[22]
    if (ss.storage.alarmVolume != payload[23]) {
        alarm_script.port.emit("volumeChange", payload[23])
    }
    ss.storage.alarmVolume = payload[23]
    ss.storage.hidePreview = payload[24]
    ss.storage.alertOn = payload[25]
    ss.storage.alertChange = payload[26]
    ss.storage.alertOff = payload[27]
    ss.storage.alertGames = payload[28]
    ss.storage.mutedChannels = payload[29]
})

function packageSettings() {
    //Give the settings to the settings script
    var followedStreamers = ss.storage.authInfo[0] != "" ? ss.storage.authInfo[3] : ss.storage.followedStreamers
    var followedGames = ss.storage.authInfo[0] != "" ? ss.storage.authInfo[4] : ss.storage.followedGames
    settingsPanel.port.emit("onSettings", [
        followedStreamers,
        ss.storage.updateInterval,
        ss.storage.soundAlarm,
        ss.storage.alarmLimit,
        ss.storage.alarmLength,
        ss.storage.uniqueIds,
        ss.storage.streamIds,
        ss.storage.darkMode,
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
        ss.storage.alertOn,
        ss.storage.alertChange,
        ss.storage.alertOff,
        followedGames,
        ss.storage.alertGames,
        ss.storage.mutedChannels,
        ss.storage.authInfo[1]
    ])
}

settingsPanel.port.on("importUser", function(payload) {
    importFollowers(payload, 0, [])
})

settingsPanel.port.on("clearAll", function() {
    delete ss.storage.followedStreamers
    ss.storage.followedStreamers = []
    updateChannels()
    packageSettings()

    delete ss.storage.followedGames
    ss.storage.followedGames = []
    genGameInfo()
    packageSettings()
})

panel.port.on("forceRefresh", function(payload) {
    forceRefresh(payload)
})

panel.port.on("endAlarm", function() {
    manageAlert(false)
})

panel.port.on("modeChange", function(payload) {
    srchoff = 0
    srchoff2 = 0
    scrollers = [false, false]
    scrollers2 = [false, false]
    panelMode = payload
    if (panelMode == 1) {
        getTopGames()
    } else if (panelMode == 2) {
        getTopStreams()
    }
})

function changeMode(newmode) {
    panel.port.emit("changeMode", newmode)
}

function completeGameInfo(input) {
    gameInfo = input
    updateBadge()
}

function genGameInfo() {
    var output = []
    var truekey = 0
    var followedGames = ss.storage.authInfo[0] != "" ? ss.storage.authInfo[4] : ss.storage.followedGames
    for (var key in offlineGames) {
        if (!containsValue(followedGames, offlineGames[key])) {
            offlineGames.splice(followedGames.indexOf(offlineGames[key]), 1)
        }
    }
    for (var key in followedGames) {
        gameSummary(function(response) {
            truekey = truekey + 1
            if ((response.json != null) ? response.json._links != null : false) {
                var name = response.json._links.self.substr(50)

                name = decodeURIComponent(name)
                name = name.split("+").join(" ")
                if (response.json.channels > 0) {
                    if (containsValue(offlineGames, name)) {
                        var namekey = offlineGames.indexOf(name)
                        var logo = "http://static-cdn.jtvnw.net/ttv-boxart/" + name + "-136x190.jpg"
                        offlineGames.splice(namekey, 1)
                        if ((!alarmOn) && (ss.storage.alertGames)) {
                            if (ss.storage.desktopNotifs) {
                                genNotif(null, name, null, logo, 3)
                            }
                            alarmCause = ""
                            manageAlert(true)
                        }
                    }
                    output.push([name, "http://static-cdn.jtvnw.net/ttv-boxart/" + name + "-{width}x{height}.jpg", true, response.json.viewers, response.json.channels])
                } else {
                    if (!containsValue(offlineGames, name)) {
                        offlineGames.push(name)
                    }
                    //output.push([name, "http://static-cdn.jtvnw.net/ttv-boxart/" + name + "-{width}x{height}.jpg", false, 0, 0])
                }
            } else {
                //Oh
            }
            if (truekey == followedGames.length) {
                completeGameInfo(output)
            }
        }, followedGames[key])
    }
    if (followedGames.length == 0) {
        completeGameInfo(output)
    }
}

function handleScroll(payload) {
    payload = payload[0]
    if (payload.length > 0) {
        if (panelMode == 0) {
            searchTwitch(payload)
        } else if (panelMode == 1) {
            searchTwitch4(payload)
        } else if (panelMode == 2) {
            searchTwitch3(payload)
        }
    } else {
        if (panelMode == 1) {
            getTopGames()
        } else if (panelMode == 2) {
            getTopStreams()
        }
    }
}

panel.port.on("sscrollup", function(payload) {
    if (payload[1]) {
        srchoff2 = 0
    } else {
        srchoff = 0
    }
    handleScroll(payload)
})


panel.port.on("scrollup", function(payload) {
    if (payload[1]) {
        srchoff2 = srchoff2 - 20
        if (srchoff2 < 0) {
            srchoff2 = 0
        }
    } else {
        srchoff = srchoff - 20
        if (srchoff < 0) {
            srchoff = 0
        }
    }
    handleScroll(payload)
})

panel.port.on("scrolldown", function(payload) {
    if (payload[1]) {
        srchoff2 = srchoff2 + 20
    } else {
        srchoff = srchoff + 20
    }
    handleScroll(payload)
})

panel.port.on("sscrolldown", function(payload) {
    if (payload[1]) {
        srchoff2 = 999999
    } else {
        srchoff = 999999
    }
    handleScroll(payload)
})

function getTopGames() {
    var output = []
    findTopGames(function(response) {
        if (response.json != null) {
            var total = response.json._total
            if ((srchoff2 >= total) && (total > 0)) {
                srchoff2 = Math.floor(total / 20) * 20
                getTopGames()
            } else {
                var tops = response.json.top
                scrollers2[0] = !(srchoff2 < 20)
                scrollers2[1] = !(tops.length < 20)
                for (var key in tops) {
                    var top = tops[key]
                    var viewers = top.viewers
                    var channels = top.channels
                    var game = top.game
                    var name = game.name
                    var box = game.box.template
                    output.push([name, box, true, viewers, channels])
                }
                topGames = output
                if (panelOn) {
                    panelUpdate()
                }
            }
        }
    }, srchoff2)
}

panel.port.on("getGames", getTopGames)

panel.port.on("clearOffset", function() {
    srchoff = 0
})

function getTopStreams() {
    var output = []
    findTopStreams(function(response) {
        if (response.json != null) {
            var total = response.json._total
            if ((srchoff >= total) && (total > 0)) {
                srchoff = Math.floor(total / 20) * 20
                getTopStreams()
            } else {
                var streams = response.json.streams
                if (streams == null) {
                    scrollers[0] = false
                    scrollers[1] = false
                } else {
                    scrollers[2] = !(srchoff != 0)
                    scrollers[0] = !(srchoff < 20)
                    scrollers[1] = !(streams.length < 20)
                    for (var key in streams) {
                        var stream = streams[key]
                        var name = stream.channel.name
                        var display_name = stream.channel.display_name
                        var logo = stream.channel.logo
                        var game = stream.channel.game
                        var views = stream.channel.views
                        var followers = stream.channel.followers
                        var status = stream.channel.status
                        game = (game == null) ? "!null!" : game
                        logo = (logo == null) ? "!null!" : logo
                        status = (status == null) ? "" : status
                        var viewers = stream.viewers
                        var time = stream.created_at
                        output.push([name, display_name, game, status, logo, viewers, genTime(time), views, followers])
                    }
                }
            }
            topStreams = output
            if (panelOn) {
                panelUpdate()
            }
        }
    }, srchoff)
}


function searchTwitch(searchTerm) {
    var output = []
    var foundchans = []
        //console.log("Now searching " + searchTerm)
    searchChannels(function(response) {
        if (response.json != null) {
            var total = response.json._total
            if ((srchoff >= total) && (total > 0)) {
                srchoff = Math.floor((total - 1) / 20) * 20
                srchoff = (srchoff < 0) ? 0 : srchoff
                searchTwitch(searchTerm)
            } else {
                var channels = response.json.channels
                scrollers[2] = !(srchoff != 0)
                scrollers[0] = !(srchoff < 20)
                scrollers[1] = !(channels.length < 20)
                for (var key in channels) {
                    var channel = channels[key]
                    var name = channel.name
                    var display_name = channel.display_name
                    var logo = channel.logo
                    var game = channel.game
                    var views = channel.views
                    var followers = channel.followers
                    var status = channel.status
                    game = (game == null) ? "!null!" : game
                    logo = (logo == null) ? "!null!" : logo
                    status = (status == null) ? "" : status
                    foundchans.push(name)
                    output.push([name, display_name, game, status, logo, null, null, views, followers])
                }
                checkStreams(function(response) {
                    if (response.json != null) {
                        var streams = response.json.streams
                        for (var key in streams) {
                            var stream = streams[key]
                            var name = stream.channel.name
                            var viewers = stream.viewers
                            var time = stream.created_at
                            var chankey = foundchans.indexOf(name)
                            output[chankey][5] = viewers
                            output[chankey][6] = genTime(time)
                        }
                        finishSearch(output)
                    } else {
                        finishSearch(null)
                    }
                }, foundchans, 0)
            }
        } else {
            finishSearch(null)
        }
    }, searchTerm, srchoff)
}

function searchTwitch2(searchTerm) {
    var output = []
    var foundgames = []
    searchGames(function(response) {
        scrollers[0] = false
        scrollers[1] = false
        if (response.json != null) {
            var games = response.json.games
            for (var key in games) {
                var game = games[key]
                var name = game.name
                foundgames.push(name)
                var box = game.box.template
                output.push([name, box, false, null, null])
            }
            searchLiveGames(function(response) {
                if (response.json != null) {
                    var games = response.json.games
                    for (var key in games) {
                        var game = games[key]
                        var name = game.name
                        var gamekey = foundgames.indexOf(name)
                        output[gamekey][2] = true
                    }
                    finishSearch(output)
                } else {
                    finishSearch(null)
                }
            }, searchTerm)
        } else {
            finishSearch(null)
        }
    }, searchTerm)
}

function searchTwitch3(searchTerm) {
    var output = []
    searchStreams(function(response) {
        if (response.json != null) {
            var total = response.json._total
            if ((srchoff2 >= total) && (total > 0)) {
                srchoff2 = Math.floor((total - 1) / 20) * 20
                srchoff2 = (srchoff2 < 0) ? 0 : srchoff2
                searchTwitch3(searchTerm)
            } else {
                var streams = response.json.streams
                scrollers2[0] = !(srchoff2 < 20)
                scrollers2[1] = !(streams.length < 20)
                for (var key in streams) {
                    var stream = streams[key]
                    var name = stream.channel.name
                    var display_name = stream.channel.display_name
                    var logo = stream.channel.logo
                    var game = stream.channel.game
                    var views = stream.channel.views
                    var followers = stream.channel.followers
                    var status = stream.channel.status
                    game = (game == null) ? "!null!" : game
                    logo = (logo == null) ? "!null!" : logo
                    status = (status == null) ? "" : status
                    var viewers = stream.viewers
                    var time = stream.created_at
                    output.push([name, display_name, game, status, logo, viewers, genTime(time), views, followers])
                }
                finishSearch(output)
            }
        } else {
            finishSearch(null)
        }
    }, searchTerm, srchoff2)
}

function searchTwitch4(gamee) {
    var output = []
    searchGame(function(response) {
        if (response.json != null) {
            var total = response.json._total
            if ((srchoff >= total) && (total > 0)) {
                srchoff = Math.floor((total - 1) / 20) * 20
                searchTwitch4(gamee)
            } else {
                var streams = response.json.streams
                scrollers[2] = !(srchoff != 0)
                scrollers[0] = !(srchoff < 20)
                scrollers[1] = !(streams.length < 20)
                for (var key in streams) {
                    var stream = streams[key]
                    var name = stream.channel.name
                    var display_name = stream.channel.display_name
                    var logo = stream.channel.logo
                    var game = stream.channel.game
                    var views = stream.channel.views
                    var followers = stream.channel.followers
                    var status = stream.channel.status
                    game = (game == null) ? "!null!" : game
                    logo = (logo == null) ? "!null!" : logo
                    status = (status == null) ? "" : status
                    var viewers = stream.viewers
                    var time = stream.created_at
                    output.push([name, display_name, game, status, logo, viewers, genTime(time), views, followers])
                }
                finishSearch(output)
            }
        } else {
            finishSearch(null)
        }
    }, gamee, srchoff)
}

function finishSearch(payload) {
    searchedChannel = false
    panel.port.emit("searchedChannel", [payload, scrollers])
}

panel.port.on("searchTwitch", function(payload) {
    var searchTerm = payload[0]
    if (searchTerm != null) {
        if (searchedChannel) {
            finishSearch(null)
            searchedChannel = true
            if (payload[1] == 0) {
                lastSearch = [0, searchTerm]
                searchTwitch(searchTerm)
            } else if (payload[1] == 1) {
                lastSearch = [1, searchTerm]
                searchTwitch2(searchTerm)
            } else if (payload[1] == 2) {
                lastSearch = [2, searchTerm]
                searchTwitch3(searchTerm)
            } else {
                lastSearch = [3, searchTerm]
                searchTwitch4(searchTerm)
            }
        } else {
            searchedChannel = true
            if (payload[1] == 0) {
                lastSearch = [0, searchTerm]
                searchTwitch(searchTerm)
            } else if (payload[1] == 1) {
                lastSearch = [1, searchTerm]
                searchTwitch2(searchTerm)
            } else if (payload[1] == 2) {
                lastSearch = [2, searchTerm]
                searchTwitch3(searchTerm)
            } else {
                lastSearch = [3, searchTerm]
                searchTwitch4(searchTerm)
            }
        }
    } else {
        finishSearch(null)
    }
})

preferences.on("settingsButton", function() {
    openSettings()
})

function genLocal1() {
    return (_("streamingFor2_") != "streamingFor2_") ? [_("streamingFor_"), _("streamingFor2_")] : [_("streamingFor_"), ""]
}

function panelUpdate() {
    //Should update when something has changed or alarm turns off
    //Give the settings to the panel
    var followedStreamers = ss.storage.authInfo[0] != "" ? ss.storage.authInfo[3] : ss.storage.followedStreamers
    var followedGames = ss.storage.authInfo[0] != "" ? ss.storage.authInfo[4] : ss.storage.followedGames

    panel.port.emit("updatePage", [
        onlineInfoS,
        generateOfflineStreamers(),
        alarmOn,
        followedStreamers,
        ss.storage.hideAvatar,
        ss.storage.hideOffline,
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
        _("separator_"), [_("searchStreamers_"), _("searchGames_"), _("searchStreams_")],
        ss.storage.darkMode,
        topGames,
        topStreams,
        followedGames,
        gameInfoS,
        scrollers,
        scrollers2,
        ss.storage.mutedChannels,
        offlineGames,
        ss.storage.authInfo[2]
    ])
}

exports.onUnload = function(reason) {
    //console.log(reason)
    if ((reason == "disable") || (reason == "uninstall")) {
        //Reset all of the storage values

        //Followers
        delete ss.storage.followedStreamers
        delete ss.storage.followedGames
        delete ss.storage.mutedChannels
        delete ss.storage.authInfo

        //Alarm
        delete ss.storage.updateInterval
        delete ss.storage.alertOn
        delete ss.storage.alertChange
        delete ss.storage.alertOff
        delete ss.storage.alertGames
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

update_interval = setInterval(authUpdate, waittime * 1000)

if (ss.storage.authInfo[0] == "") {
    updateChannels()
    genGameInfo()
} else {
    authUpdate()
}