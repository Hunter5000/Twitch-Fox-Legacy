//Imported variables
onlineInfo = []
offlineStreamers = []
alarmOn = null
hideLogo = null
offlineHide = null
followedStreamers = []
followedGames = []
mutedChannels = []
offlineGames = []
previewWait = null
openTab = null
useLive = null
openChat = null
tutorial = null
alarmCause = null
liveError = null
errorCause = null
hidePreview = null
local1 = null
local2 = null
local3 = ["", "", ""]
darkMode = null
topGames = []
topStreams = []
topVideos = []
gameInfo = []
videoInfo = []
scrollers0 = null
scrollers1 = null
scrollers2 = null
authName = ""

//Unique variables

scrollUp = false
scrollDown = false

searchResult = null
searchTarget = ""
searchHistory = []
searchTerm = ""

rotatedegs = 0
searching_interval = null
import_interval = null
searchingTwitch = false
noResults = false
extraInfo = []
bigPreviews = []
authUpdate = false
authStart = false
gameFollows = false
videoFollows = false

mode = 0
twitchMode = null
menuButton = document.getElementById("!menu")
menu2 = document.getElementById("!menu2")
menu3 = document.getElementById("!menu3")
menu4 = document.getElementById("!menu4")
menu5 = document.getElementById("!menu5")
oncounter = document.getElementById("!oncount")
menuOpen = false

function infoGet(ar, n) {
    var output = []
    for (var key in ar) {
        output.push(ar[key][n])
    }
    return output
}

document.getElementById("!connecttwitch").onclick = function () {
    addon.port.emit("login")
}

document.getElementById("!logout").onclick = function () {
    addon.port.emit("logout")
}

document.getElementById("!authname").onclick = function () {
    addon.port.emit("openProfile")
}

function startRotation() {
    clearInterval(searching_interval)
    rotatedegs = 0
    document.getElementById("!forcerefresh").style.transform = "rotate(0deg)"
    searching_interval = setInterval(rotateRefresh, 30)
}

function endRotation() {
    clearInterval(searching_interval)
    rotatedegs = 0
    document.getElementById("!forcerefresh").style.transform = "rotate(0deg)"
}

function endSearch(reason, spare, error, back) {
    endRotation()
    searchingTwitch = false
    if (!error) {
        noResults = false
        var lastSearch = searchHistory[searchHistory.length - 2] === undefined ? [null, ""] : searchHistory[searchHistory.length - 2]
        if (!back) {
            lastSearch = [null, ""]
        }
        searchTarget = lastSearch[1]
        if (!spare) {
            searchTerm = lastSearch[1]
        }
        if ((searchHistory.length > 1) && back) {
            searchHistory.splice(searchHistory.length - 2, 2)
            searchTwitch(lastSearch[0], lastSearch[1])
        } else {
            if (!spare) {
                document.getElementById("!followsearch").value = ""
            }
            searchHistory = []
            searchResult = null
        }
    } else {
        noResults = true
        searchResult = null
    }
    updateList()
        //searchTwitch(null)
        //console.log("Search ended. Reason: " + reason)
}

//0=Channel, 2 = Game

function onClick(obj, typ) {
    obj.onclick = function () {
        var actname = obj.id.slice(0, -1)
        if (typ == 0) {
            if (openTab) {
                addon.port.emit("openTab", actname)
            }
            if (useLive) {
                addon.port.emit("openLive", actname)
            }
            if (openChat) {
                var baseurl = "http://www.twitch.tv/" + actname + "/chat?popout="
                window.open(baseurl, '_blank', 'right=50,top=50,width=400,height=600,resizable=yes,scrollbars=no,toolbar=no,location=no,directories=no,status=no,menubar=no,copyhistory=no')
            }
        } else if (typ == 1) {
            addon.port.emit("openTab", actname)
        }
    }

}

function onClick2(obj) { //Clicking on a game
    obj.onclick = function () {
        var actname = obj.id.slice(0, -1)
        searchTwitch(3, actname)
    }
}

function onVideoClick(obj) { //Clicking on a game
    obj.onclick = function () {
        var actname = (obj.id.slice(0, -1)).split("|")[1]
        if (openTab) {
            addon.port.emit("openTab", actname)
        }
        if (useLive) {
            addon.port.emit("openLive", actname)
        }
    }
}

function previewTog(obj) {
    obj.onclick = function () {
        var actname = obj.id.slice(0, -1)
        if (!containsValue(bigPreviews, actname)) {
            bigPreviews.unshift(actname)
            updateList()
        } else {
            var namekey = bigPreviews.indexOf(actname)
            bigPreviews.splice(namekey, 1)
            updateList()
        }
    }
}

function openTab_(obj) {
    obj.onclick = function () {
        var strname = obj.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.id
        addon.port.emit("openTab", strname)
        if (containsValue(extraInfo, strname)) {
            var namekey = extraInfo.indexOf(strname)
            extraInfo.splice(namekey, 1)
            updateList()
        }
    }
}

function openLive_(obj) {
    obj.onclick = function () {
        var strname = obj.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.id
        addon.port.emit("openLive", strname)
        if (containsValue(extraInfo, strname)) {
            var namekey = extraInfo.indexOf(strname)
            extraInfo.splice(namekey, 1)
            updateList()
        }
    }
}

function openChat_(obj) {
    obj.onclick = function () {
        var strname = obj.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.id
        var baseurl = "http://www.twitch.tv/" + strname + "/chat?popout="
        window.open(baseurl, '_blank', 'right=50,top=50,width=400,height=600,resizable=yes,scrollbars=no,toolbar=no,location=no,directories=no,status=no,menubar=no,copyhistory=no')
        if (containsValue(extraInfo, strname)) {
            var namekey = extraInfo.indexOf(strname)
            extraInfo.splice(namekey, 1)
            updateList()
        }
    }
}

function openTabVid_(obj) {
    obj.onclick = function () {
        var strname = obj.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.id.split("|")[1]
        addon.port.emit("openTab", strname)
        if (containsValue(extraInfo, strname)) {
            var namekey = extraInfo.indexOf(strname)
            extraInfo.splice(namekey, 1)
            updateList()
        }
    }
}

function openLiveVid_(obj, res) {
    obj.onclick = function () {
        var strname = obj.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.id.split("|")[1]
        addon.port.emit("openLive", strname)
        if (containsValue(extraInfo, strname)) {
            var namekey = extraInfo.indexOf(strname)
            extraInfo.splice(namekey, 1)
            updateList()
        }
    }
}

function openChannel_(obj) {
    obj.onclick = function () {
        var strname = obj.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.id.split("|")
        addon.port.emit("openTab", strname[0])
        if (containsValue(extraInfo, strname[1])) {
            var namekey = extraInfo.indexOf(strname[1])
            extraInfo.splice(namekey, 1)
            updateList()
        }
    }
}

//0 = Channel, 2 = Game

function follow(obj) {
    obj.onclick = function () {
        var strname = obj.id.slice(0, -1)
        addon.port.emit("follow", strname)
    }
}

function follow2(obj) {
    obj.onclick = function () {
        var strname = obj.id.slice(0, -1)
        addon.port.emit("follow2", strname)
    }
}

function unfollow(obj) {
    obj.onclick = function () {
        var strname = obj.id.slice(0, -1)
        addon.port.emit("unfollow", strname)
        if (containsValue(extraInfo, strname)) {
            var namekey = extraInfo.indexOf(strname)
            extraInfo.splice(namekey, 1)
            updateList()
        }
    }
}

function unfollow2(obj) {
    obj.onclick = function () {
        var strname = obj.id.slice(0, -1)
        addon.port.emit("unfollow2", strname)
    }
}

function mute(obj, typ) {
    obj.onclick = function () {
        var strname = obj.id.slice(0, -1)
        addon.port.emit("mute", strname)
    }
}

function unmute(obj, typ) {
    obj.onclick = function () {
        var strname = obj.id.slice(0, -1)
        addon.port.emit("unmute", strname)
    }
}

function vidsrch(obj) {
    obj.onclick = function () {
        var strname = obj.id.slice(0, -1)
        searchTwitch(4, strname)
    }
}

function vidsrch2(obj) {
    obj.onclick = function () {
        var strname = obj.id.slice(0, -1)
        searchTwitch(5, strname)
    }
}

function rotateRefresh() {
    document.getElementById("!forcerefresh").style.transform = "rotate(" + rotatedegs + "deg)"
    rotatedegs = rotatedegs + 10
}

function onRightClick(obj) {
    obj.oncontextmenu = function () {
        var actname = obj.id.slice(0, -1)
        if (!containsValue(extraInfo, actname)) {
            extraInfo.unshift(actname)
            updateList()
        } else {
            var namekey = extraInfo.indexOf(actname)
            extraInfo.splice(namekey, 1)
            updateList()
        }
    }
}

function onRightClickVid(obj) {
    obj.oncontextmenu = function () {
        var actname = (obj.id.slice(0, -1)).split("|")[1]
        if (!containsValue(extraInfo, actname)) {
            extraInfo.unshift(actname)
            updateList()
        } else {
            var namekey = extraInfo.indexOf(actname)
            extraInfo.splice(namekey, 1)
            updateList()
        }
    }
}

function containsValue(list, obj) {
    return ((list.indexOf(obj)) > -1)
}

document.getElementById("!settings").onclick = function () {
    addon.port.emit("openSettings")
}

document.getElementById("!twitchmode").onclick = function () {
    twitchMode = !twitchMode
    updateList()
}

menuButton.onclick = function () {
    if (menuButton.className == "back") {
        endSearch("Button pressed", false, false, true)
    } else {
        menuOpen = !menuOpen
        updateList()
    }
}

function modeChange() {
    gameFollows = false
    videoFollows = false
    addon.port.emit("modeChange", mode)
    if (mode != 0) {
        startRotation()
    }
}

menu2.onclick = function () {
    menuOpen = false
    if (menu2.className == "followed") {
        mode = 0
        updateList()
        modeChange()
    } else if (menu2.className == "games") {
        mode = 1
        updateList()
        modeChange()
    }
}

menu3.onclick = function () {
    menuOpen = false
    if (menu3.className == "games") {
        mode = 1
        updateList()
        modeChange()
    } else if (menu3.className == "channels") {
        mode = 2
        updateList()
        modeChange()
    }
}

menu4.onclick = function () {
    menuOpen = false
    if (menu4.className == "channels") {
        mode = 2
        updateList()
        modeChange()
    } else if (menu4.className == "videos") {
        mode = 3
        updateList()
        modeChange()
    }
}

menu5.onclick = function () {
    gameFollows = !gameFollows
    videoFollows = !videoFollows
    updateList()
}

document.getElementById("!searchtwitch").onclick = function () {
    if (mode != 3) {
        searchTwitch(mode, searchTerm)
    }
}

document.getElementById("!followsearch").onkeydown = function (e) {
    if (e.keyCode == 13) {
        if (mode != 3) {
            searchTwitch(mode, searchTerm)
        }
    }
}

document.getElementById("!sscrollup").onclick = function () {
    if (!scrollDown && !scrollUp) {
        var lastSearch = searchHistory[searchHistory.length - 1] === undefined ? null : searchHistory[searchHistory.length - 1][0]
        if (mode == 3) {
            lastSearch = videoFollows ? 6 : null
        }
        scrollDown = true
        startRotation()
        addon.port.emit("sscrollup", [searchTarget, lastSearch])
    }
}

document.getElementById("!scrollup").onclick = function () {
    if (!scrollDown && !scrollUp) {
        var lastSearch = searchHistory[searchHistory.length - 1] === undefined ? null : searchHistory[searchHistory.length - 1][0]
        if (mode == 3) {
            lastSearch = videoFollows ? 6 : null
        }
        scrollUp = true
        startRotation()
        addon.port.emit("scrollup", [searchTarget, lastSearch])
    }
}

document.getElementById("!scrolldown").onclick = function () {
    if (!scrollDown && !scrollUp) {
        var lastSearch = searchHistory[searchHistory.length - 1] === undefined ? null : searchHistory[searchHistory.length - 1][0]
        if (mode == 3) {
            lastSearch = videoFollows ? 6 : null
        }
        scrollDown = true
        startRotation()
        addon.port.emit("scrolldown", [searchTarget, lastSearch])
    }
}

document.getElementById("!sscrolldown").onclick = function () {
    if (!scrollDown && !scrollUp) {
        var lastSearch = searchHistory[searchHistory.length - 1] === undefined ? null : searchHistory[searchHistory.length - 1][0]
        if (mode == 3) {
            lastSearch = videoFollows ? 6 : null
        }
        scrollUp = true
        startRotation()
        addon.port.emit("sscrolldown", [searchTarget, lastSearch])
    }
}

function performSearch() {
    document.getElementById("!upspan").style.display = "none"
    document.getElementById("!downspan").style.display = "none"
    if (!(searchHistory.length > 0)) {
        document.getElementById("!tutorial5").style.display = "none"
        document.getElementById("!tutorial8").style.display = "none"
        document.getElementById("!tutorial9").style.display = "none"
        document.getElementById("!tutorialoff").style.display = "none"
        if (mode == 0) {
            var searchOff = 0
            var searchOn = 0
            for (var key in offlineStreamers) {
                if (document.getElementById(offlineStreamers[key])) {
                    var elem = document.getElementById(offlineStreamers[key])
                    if ((offlineStreamers[key].search(searchTerm)) != -1) {
                        elem.style.display = "inline"
                        searchOff += 1
                    } else {
                        elem.style.display = "none"
                    }

                }
            }
            var tempOn = infoGet(onlineInfo, 0)
            var tempDisp = infoGet(onlineInfo, 1)
            var tempGames = infoGet(onlineInfo, 2)
            var tempStatuses = infoGet(onlineInfo, 3)
            for (var key in tempOn) {
                if (document.getElementById(tempOn[key])) {
                    var elem = document.getElementById(tempOn[key])
                    if (((tempDisp[key].toLowerCase()).search(searchTerm) != -1) || (tempGames[key].toLowerCase().search(searchTerm) != -1) || (tempStatuses[key].toLowerCase().search(searchTerm) != -1)) {
                        elem.style.display = "inline"
                        searchOn += 1
                    } else {
                        elem.style.display = "none"
                    }
                }
            }
            document.getElementById("!offlinespan").style.display = (searchOff > 0) ? "inline" : "none"
            document.getElementById("!onlinespan").style.display = (searchOn > 0) ? "inline" : "none"
            document.getElementById("!onoffdiv").style.display = ((searchOn > 0) && (searchOff > 0)) ? "inline" : "none"
        } else if (mode == 1) {
            var searchOff = 0
            var searchOn = 0
            document.getElementById("!upspan").style.display = (scrollers0[0] && searchTerm == "") ? "inline" : "none"
            document.getElementById("!downspan").style.display = (scrollers0[1] && searchTerm == "") ? "inline" : "none"
            document.getElementById("!offlinespan").style.display = "inline"
            if (gameFollows) {
                for (var key in followedGames) {
                    var curGame = followedGames[key]
                    if (document.getElementById(curGame)) {
                        var elem = document.getElementById(curGame)
                        if (curGame.toLowerCase().search(searchTerm) != -1) {
                            elem.style.display = "inline"
                            searchOn += 1
                        } else {
                            elem.style.display = "none"
                        }
                    }
                }
            } else {
                for (var key in topGames) {
                    var curGame = topGames[key][0]
                    if (document.getElementById(curGame)) {
                        var elem = document.getElementById(curGame)
                        if (curGame.toLowerCase().search(searchTerm) != -1) {
                            elem.style.display = "inline"
                            searchOff += 1
                        } else {
                            elem.style.display = "none"
                        }
                    }
                }
            }
            document.getElementById("!offlinespan").style.display = (searchOff > 0) ? "inline" : "none"
            document.getElementById("!onlinespan").style.display = (searchOn > 0) ? "inline" : "none"
            document.getElementById("!onoffdiv").style.display = "none"
        } else if (mode == 2) {
            var searchOff = 0
            document.getElementById("!upspan").style.display = (scrollers0[0] && searchTerm == "") ? "inline" : "none"
            document.getElementById("!downspan").style.display = (scrollers0[1] && searchTerm == "") ? "inline" : "none"
            document.getElementById("!offlinespan").style.display = "inline"
            document.getElementById("!onlinespan").style.display = "none"
            document.getElementById("!onoffdiv").style.display = "none"
            for (var key in topStreams) {
                var curStream = topStreams[key]
                if (document.getElementById(curStream[0])) {
                    var elem = document.getElementById(topStreams[key][0])
                    if ((curStream[1].toLowerCase().search(searchTerm) != -1) || (curStream[2].toLowerCase().search(searchTerm) != -1) || (curStream[3].toLowerCase().search(searchTerm) != -1)) {
                        elem.style.display = "inline"
                        searchOff += 1
                    } else {
                        elem.style.display = "none"
                    }
                }
            }
            document.getElementById("!offlinespan").style.display = (searchOff > 0) ? "inline" : "none"
        } else if (mode == 3) {
            var searchOff = 0
            var searchOn = 0
            if (videoFollows) {
                document.getElementById("!upspan").style.display = (scrollers2[0] && searchTerm == "") ? "inline" : "none"
                document.getElementById("!downspan").style.display = (scrollers2[1] && searchTerm == "") ? "inline" : "none"
                for (var key in videoInfo) {
                    var curVideo = videoInfo[key]
                    if (document.getElementById(curVideo[4] + "|" + curVideo[8])) {
                        var elem = document.getElementById(curVideo[4] + "|" + curVideo[8])
                        if ((curVideo[0].toLowerCase().search(searchTerm) != -1) || (curVideo[1].toLowerCase().search(searchTerm) != -1) || (curVideo[4].toLowerCase().search(searchTerm) != -1) || (curVideo[5].toLowerCase().search(searchTerm) != -1)) {
                            elem.style.display = "inline"
                            searchOff += 1
                        } else {
                            elem.style.display = "none"
                        }
                    }
                }
            } else {
                document.getElementById("!upspan").style.display = (scrollers0[0] && searchTerm == "") ? "inline" : "none"
                document.getElementById("!downspan").style.display = (scrollers0[1] && searchTerm == "") ? "inline" : "none"
                for (var key in topVideos) {
                    var curVideo = topVideos[key]
                    if (document.getElementById(curVideo[4] + "|" + curVideo[8])) {
                        var elem = document.getElementById(curVideo[4] + "|" + curVideo[8])
                        if ((curVideo[0].toLowerCase().search(searchTerm) != -1) || (curVideo[1].toLowerCase().search(searchTerm) != -1) || (curVideo[4].toLowerCase().search(searchTerm) != -1) || (curVideo[5].toLowerCase().search(searchTerm) != -1)) {
                            elem.style.display = "inline"
                            searchOff += 1
                        } else {
                            elem.style.display = "none"
                        }
                    }
                }
            }
            document.getElementById("!offlinespan").style.display = (searchOff > 0) ? "inline" : "none"
            document.getElementById("!onoffdiv").style.display = "none"
        }
        //Behold the wall of conditionals
        document.getElementById("!tutorial1").style.display = (tutorial && (!followedStreamers.length > 0) && (mode == 2) && (searchOff > 0)) ? "inline" : "none"
        document.getElementById("!tutorial1.5").style.display = (tutorial && mode == 3 && videoFollows && !(videoInfo.length > 0)) ? "inline" : "none"
        document.getElementById("!tutorial2").style.display = (tutorial && !(followedStreamers.length > 0) && (mode == 0)) ? "inline" : "none"
        document.getElementById("!tutorial2.1").style.display = !(twitchMode && (authName == "")) ? "inline" : "none"
        document.getElementById("!tutorial2.2").style.display = (twitchMode && (authName == "")) ? "inline" : "none"
        document.getElementById("!tutorial3").style.display = (tutorial && (followedStreamers.length > 0) && (mode == 0) && (!followedGames.length > 0)) ? "inline" : "none"
        document.getElementById("!tutorial4").style.display = (tutorial && !(followedGames.length > 0) && (mode == 1)) ? "inline" : "none"
        document.getElementById("!tutorial4.1").style.display = !(gameFollows) ? "inline" : "none"
        document.getElementById("!tutorial4.2").style.display = (gameFollows) ? "inline" : "none"
        document.getElementById("!tutorial6").style.display = (tutorial && (followedStreamers.length > 0) && (mode == 0) && (searchOn > 0) && (followedGames.length > 0) && !(extraInfo.length > 0)) ? "inline" : "none"
        document.getElementById("!tutorial7").style.display = (tutorial && (!searchingTwitch) && (!noResults) && (followedStreamers.length > 0) && (mode == 2) && (!(bigPreviews.length > 0) || !(followedGames.length > 0))) ? "inline" : "none"
        document.getElementById("!tutorialoff").style.display = (((tutorial && (followedStreamers.length > 0) && (mode == 2) && (followedGames.length > 0) && (bigPreviews.length > 0 && followedGames.length > 0))) || (tutorial && (followedStreamers.length > 0) && (mode == 0) && (followedGames.length > 0) && (extraInfo.length > 0))) ? "inline" : "none"
    } else {
        var srcht = searchHistory[searchHistory.length - 1][0]
        document.getElementById("!tutorial1").style.display = (!searchingTwitch && !noResults && tutorial && (!(mode == 0) || (mode == 0 && srcht == 0)) && (!followedStreamers.length > 0) && ((!(mode == 1) && srcht != 4) || (mode == 1 && (srcht == 3)))) ? "inline" : "none"
        document.getElementById("!tutorial9").style.display = (!searchingTwitch && !noResults && (!(extraInfo.length > 0) || !(followedGames.length > 0)) && tutorial && (followedStreamers.length > 0) && ((followedGames.length > 0) || (mode != 0)) && (!(mode == 1) || (mode == 1 && srcht == 3))) ? "inline" : "none"
        document.getElementById("!tutorialoff").style.display = (!searchingTwitch && !noResults && ((extraInfo.length > 0) && (followedGames.length > 0)) && tutorial && (followedStreamers.length > 0) && ((followedGames.length > 0) || (mode != 0)) && (!(mode == 1) || (mode == 1 && srcht == 3))) ? "inline" : "none"
        document.getElementById("!tutorial5").style.display = (!searchingTwitch && !noResults && tutorial && (!followedGames.length > 0) && mode == 1 && !(srcht > 2)) ? "inline" : "none"
        document.getElementById("!tutorial8").style.display = (!searchingTwitch && !noResults && tutorial && (followedStreamers.length > 0) && (mode == 0 && (srcht != 4)) && !(followedGames.length > 0)) ? "inline" : "none"
        document.getElementById("!tutorial2").style.display = "none"
        document.getElementById("!tutorial3").style.display = "none"
        document.getElementById("!tutorial4").style.display = "none"
        document.getElementById("!tutorial6").style.display = "none"
        document.getElementById("!offlinespan").style.display = "inline"
        document.getElementById("!onlinespan").style.display = "none"
        document.getElementById("!onoffdiv").style.display = "none"
        if (srcht <= 3) {
            if (scrollers1[0] && !searchingTwitch) {
                document.getElementById("!upspan").style.display = "inline"
            }
            if (scrollers1[1] && !searchingTwitch) {
                document.getElementById("!downspan").style.display = "inline"
            }
        } else if (srcht >= 4) {
            if (scrollers2[0] && !searchingTwitch) {
                document.getElementById("!upspan").style.display = "inline"
            }
            if (scrollers2[1] && !searchingTwitch) {
                document.getElementById("!downspan").style.display = "inline"
            }
        }
        if (noResults && (!searchingTwitch)) {
            if (srcht == 3) {
                document.getElementById("!nochannels").style.display = "inline"
            } else if (srcht > 3) {
                document.getElementById("!novids").style.display = "inline"
            } else if (srcht < 3) {
                document.getElementById("!noresults").style.display = "inline"
            }
        }
    }
    if (scrollUp) {
        scrollUp = false
        window.scrollTo(0, 99999)
    }
    if (scrollDown) {
        scrollDown = false
        window.scrollTo(0, 0)
    }
}

document.getElementById("!followsearch").oninput = function () {
    searchTerm = document.getElementById("!followsearch").value.toLowerCase()
    performSearch()
}

document.getElementById("!forcerefresh").onclick = function () {
    startRotation()
    addon.port.emit("forceRefresh", (searchHistory.length > 0))
}

function timeDifference(time){
    var curUTC = Date.now()
    timeDif = curUTC - time
    var difHrs = Math.floor(timeDif / 3600000)
    timeDif = timeDif - (difHrs * 3600000)
    var difMns = Math.floor(timeDif / 60000)
    timeDif = timeDif - (difMns * 60000)
    var difScs = Math.floor(timeDif / 1000)
    difHrs = (difHrs == 0) ? "" : difHrs = difHrs + ":"
    difMns = ((difMns < 10) && (difHrs != 0)) ? "0" + difMns + ":" : difMns + ":"
    difScs = (difScs < 10) ? "0" + difScs : difScs
    return difHrs + difMns + difScs
}

function createDate(time) {
    var a = new Date(time);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var output = ""
    if (local2 == ",") {
        output = month + ' ' + date + ' ' + year
    } else if (local2 == ".") {
        output = date + ' ' + month + ' ' + year
    }
    return output;
}

function secToTime(time) {
    var sec_num = parseInt(time, 10);
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    hours = (hours > 0) ? hours : ""
    if (hours != "") {
        hours = hours + ":"
    }
    if (minutes < 10 && hours != "") {
        minutes = "0" + minutes
    }
    minutes = minutes + ":"
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    var output = hours + minutes + seconds;
    return output;
}

function insSeparators(num) {
    if (num != null) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, local2);
    }
}

function generateCard(typ, name) {
    //Type: 0 = channel w/ info, 1 = channel w/o info, 2 = game w/info, 3 = game w/o info, 4 = video
    if (typ == 0) {
        var display_name = name[1]
        var game = name[2]
        var status = name[3]
        var logo = name[4]
        var viewers = name[5]
        var time = name[6]
        var views = name[7]
        var followers = name[8]
        name = name[0]

        if (logo == "!null!") {
            logo = "http://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_150x150.png"
        }

        var mainLi = document.createElement("li")
        mainLi.style.margin = "0px"
        mainLi.id = name
        var mainTable = document.createElement("table")
        mainTable.style.width = "100%"
        mainTable.border = "0"
        mainTable.cellpadding = "4"
        mainTable.cellspacing = "0"

        var tr0 = document.createElement("tr")
        mainTable.appendChild(tr0)
        var td05 = document.createElement("td")

        if (containsValue(bigPreviews, name)) {
            tr0.style.width = "0px"
            mainTable.style.tableLayout = "fixed"
            var td1b = document.createElement("table")
            var mainDiv = document.createElement("div")
            mainDiv.style.whiteSpace = "nowrap"
            mainDiv.style.maxWidth = "429px"
            mainDiv.style.overflow = "hidden"
            var mainTbody = document.createElement("table")
            mainTbody.className = "option"
            mainTbody.id = name + "!"
            td1b.style.whiteSpace = "nowrap"
            var img2 = document.createElement("div")
            img2.className = "streamer"
            img2.style.verticalAlign = "bottom"
            var span1 = document.createElement("span")
            span1.className = "online"
            var bold1 = document.createElement("strong")
            bold1.textContent = " " + display_name + " "
            span1.appendChild(bold1)
            mainTbody.appendChild(img2)
            mainTbody.appendChild(span1)
            var img6 = document.createElement("div")
            img6.className = "viewers"
            img6.style.verticalAlign = "bottom"
            var span3 = document.createElement("span")
            span3.textContent = insSeparators(viewers) + "     "
            span3.style.overflow = "hidden"
            mainTbody.appendChild(img6)
            mainTbody.appendChild(span3)
            td1b.appendChild(mainTbody)
            var img7 = document.createElement("div")
            img7.className = "game"
            img7.style.verticalAlign = "bottom"
            mainTbody.appendChild(img7)
            var span4 = document.createElement("strong")
            span4.style.overflow = "hidden"
            if ((game == "!null!") || (game == "")) {
                var ital2 = document.createElement("i")
                span4.textContent = " None"
                ital2.appendChild(span4)
                mainTbody.appendChild(ital2)
            } else {
                span4.textContent = " " + game
                mainTbody.appendChild(span4)
            }
            mainDiv.appendChild(mainTbody)
            td1b.appendChild(mainDiv)
            if ((views != null || followers != null) || (containsValue(extraInfo, name))) {
                var td0 = document.createElement("td")
                td0.style.width = "24px"
                td0.id = name + "_"
                var div1 = document.createElement("div")
                div1.style.display = "inline-block"
                div1.style.height = "26px"
                div1.style.width = "26px"
                div1.style.position = "relative"
                div1.style.bottom = "-9px"
                if (!containsValue(followedStreamers, name)) {
                    div1.className = "follow"
                    follow(td0)
                } else {
                    div1.className = "unfollow"
                    unfollow(td0)
                }
                td0.appendChild(div1)
                td1b.appendChild(td0)
            }
            tr0.appendChild(td1b)
            var tr05 = document.createElement("tr")
            mainTable.appendChild(tr05)
            var td1c = document.createElement("td")
            td1c.rowSpan = "10"
            var img3 = document.createElement("div")
            img3.id = name + "?"
            var unix = new Date().getTime()
            unix = Math.ceil(unix / 1000)
            unix = Math.ceil(unix / previewWait)
            img3.className = "preview"
            previewTog(img3)
            img3.style.backgroundImage = "url('http://static-cdn.jtvnw.net/previews-ttv/live_user_" + name + "-458x258.jpg?" + String(unix) + "')"
            img3.style.width = "458px"
            img3.style.height = "258px"
            img3.align = "left"
            img3.style.position = "relative"
            img3.style.left = "1px"
            td1c.appendChild(img3)
            tr05.appendChild(td1c)
                //tr1.appendChild(td1c)
        } else {
            mainTable.style.borderSpacing = "0px"
            tr0.appendChild(td05)
            if ((time != null) && (!hidePreview)) {
                var td1c = document.createElement("td")
                td1c.rowSpan = "10"
                var img3 = document.createElement("div")
                img3.id = name + "?"
                var unix = new Date().getTime()
                unix = Math.ceil(unix / 1000)
                unix = Math.ceil(unix / previewWait)
                img3.className = "preview"
                previewTog(img3)
                img3.style.backgroundImage = "url('http://static-cdn.jtvnw.net/previews-ttv/live_user_" + name + "-139x78.jpg?" + String(unix) + "')"
                img3.style.width = "139px"
                img3.style.height = "78px"
                img3.align = "right"
                td1c.appendChild(img3)
                tr0.appendChild(td1c)
                    //tr1.appendChild(td1c)
            }
            if (containsValue(extraInfo, name) && (time != null)) {
                var btntbl = document.createElement("table")
                btntbl.style.width = "30px"
                btntbl.style.height = "100%"
                var btntd = document.createElement("td")
                btntd.appendChild(btntbl)
                btntd.style.height = "100%"
                btntd.style.width = "30px"
                var btnr0 = document.createElement("tr")
                btnr0.style.height = "33%"
                var btnd0 = document.createElement("td")
                btnd0.style.width = "30px"
                btnd0.className = "twitch"
                openTab_(btnd0)
                btnr0.appendChild(btnd0)
                btntbl.appendChild(btnr0)
                var btnr1 = document.createElement("tr")
                btnr1.style.height = "33%"
                var btnd1 = document.createElement("td")
                btnd1.style.width = "30px"
                btnd1.className = "live"
                openLive_(btnd1)
                btnr1.appendChild(btnd1)
                btntbl.appendChild(btnr1)
                var btnr2 = document.createElement("tr")
                btnr2.style.height = "33%"
                var btnd2 = document.createElement("td")
                btnd2.style.width = "30px"
                btnd2.className = "chat"
                openChat_(btnd2)
                btnr2.appendChild(btnd2)
                btntbl.appendChild(btnr2)
                tr0.appendChild(btntd)
            }
            if ((views != null || followers != null) || (containsValue(extraInfo, name))) {
                var extbl = document.createElement("table")
                extbl.style.width = "100%"
                extbl.style.height = "100%"
                var extd = document.createElement("td")
                extd.style.height = "100%"
                extd.style.width = "30px"
                extd.appendChild(extbl)

                var extr0 = document.createElement("tr")

                extr0.style.width = "100%"
                extbl.appendChild(extr0)
                var extr1 = document.createElement("tr")
                var td0 = document.createElement("td")
                td0.style.width = "100%"
                td0.id = name + "_"

                var vidtr = document.createElement("tr")
                var vidtd = document.createElement("td")
                vidtd.style.width = "100%"
                vidtd.id = name + "*"
                vidtd.className = "video"
                vidsrch(vidtd)

                if (!containsValue(followedStreamers, name)) {
                    td0.className = "follow"
                    extr0.style.height = "50%"
                    follow(td0)
                    vidtr.style.height = "50%"
                } else {
                    td0.className = "unfollow"
                    unfollow(td0)

                    extr0.style.height = "33%"
                    extr1.style.height = "33%"
                    vidtr.style.height = "33%"
                    extr1.style.width = "100%"
                    extbl.appendChild(extr1)

                    var td01 = document.createElement("td")
                    td01.style.width = "100%"
                    td01.id = name + "$"
                    if (containsValue(mutedChannels, name)) {
                        td01.className = "unmute"
                        unmute(td01)
                    } else {
                        td01.className = "mute"
                        mute(td01)
                    }
                    extr1.appendChild(td01)
                }
                extbl.appendChild(vidtr)
                extr0.appendChild(td0)
                vidtr.appendChild(vidtd)
                tr0.appendChild(extd)
            }
            var tr1 = document.createElement("tr")
            var mainTbody = document.createElement("table")
            mainTbody.className = "option"
            mainTbody.id = name + "!"
            mainTbody.style.width = "100%"
            mainTbody.border = "0"
            mainTbody.style.borderSpacing = "0px"
            mainTbody.style.tableLayout = "fixed"
                //Row 1
            if (!hideLogo) {
                var td1a = document.createElement("td")
                td1a.style.width = "78px"
                td1a.rowSpan = "10"
                var img1 = document.createElement("div")
                img1.className = "logo"
                img1.style.backgroundImage = "url('" + logo + "')"
                img1.align = "left"
                td1a.appendChild(img1)
                tr1.appendChild(td1a)
            }
            var td1b = document.createElement("td")
            td1b.style.whiteSpace = "nowrap"
            var img2 = document.createElement("div")
            img2.className = "streamer"
            img2.style.verticalAlign = "bottom"
            var span1 = document.createElement("span")
            span1.className = (time != null) ? "online" : "offline"
            var bold1 = document.createElement("strong")
            bold1.textContent = " " + display_name + " "
            span1.appendChild(bold1)
            td1b.appendChild(img2)
            td1b.appendChild(span1)
            if (viewers != null) {
                var img6 = document.createElement("div")
                img6.className = "viewers"
                img6.style.verticalAlign = "bottom"
                var span3 = document.createElement("span")
                span3.textContent = insSeparators(viewers)
                span3.style.overflow = "hidden"
                td1b.appendChild(img6)
                td1b.appendChild(span3)
            }
            tr1.appendChild(td1b)
                //Row 2
            var tr2 = document.createElement("tr")
            var td2 = document.createElement("td")
            var img4 = document.createElement("div")
            img4.className = "channel"
            img4.style.verticalAlign = "bottom"
            td2.appendChild(img4)
            var span2 = document.createElement("span")
            span2.style.wordWrap = "break-word"
            if ((name == errorCause) && liveError) {
                span2.textContent = " Livestreamer Path Error!"
                span2.style.color = "Red"
                span2.style.fontWeight = "bold"
                td2.appendChild(span2)
            } else {
                if (status != "") {
                    span2.textContent = ' "' + status + '"'
                    td2.appendChild(span2)
                } else {
                    var ital1 = document.createElement("i")
                    span2.textContent = " Untitled Broadcast"
                    ital1.appendChild(span2)
                    td2.appendChild(ital1)
                }
            }
            tr2.appendChild(td2)
            mainTbody.appendChild(tr2)
                //Row 3
            var tr3 = document.createElement("tr")
            var td3 = document.createElement("td")
            var img5 = document.createElement("div")
            img5.className = "game"
            img5.style.verticalAlign = "bottom"
            td3.appendChild(img5)
            var bold2 = document.createElement("strong")
            if ((game == "!null!") || (game == "")) {
                var ital2 = document.createElement("i")
                bold2.textContent = " None"
                ital2.appendChild(bold2)
                td3.appendChild(ital2)
            } else {
                bold2.textContent = " " + game
                td3.appendChild(bold2)
            }
            tr3.appendChild(td3)
            mainTbody.appendChild(tr3)
                //Row 4
            if (views != null) {
                var tr4 = document.createElement("tr")
                var td4 = document.createElement("td")
                var img45 = document.createElement("div")
                img45.className = "views"
                img45.style.verticalAlign = "bottom"
                td4.appendChild(img45)
                var span45 = document.createElement("span")
                span45.textContent = " " + insSeparators(views)
                td4.appendChild(span45)
                tr4.appendChild(td4)
                mainTbody.appendChild(tr4)
            }
            //Row 4.5
            if (followers != null) {
                var tr45 = document.createElement("tr")
                var td45 = document.createElement("td")
                var img475 = document.createElement("div")
                img475.className = "followers"
                img475.style.verticalAlign = "bottom"
                td45.appendChild(img475)
                var span475 = document.createElement("span")
                span475.textContent = " " + insSeparators(followers)
                td45.appendChild(span475)
                tr45.appendChild(td45)
                mainTbody.appendChild(tr45)
            }
            //Row 5
            if (time != null) {
                var tr5 = document.createElement("tr")
                var td5 = document.createElement("td")
                var img7 = document.createElement("div")
                img7.className = "time"
                img7.style.verticalAlign = "bottom"
                td5.appendChild(img7)
                var span4 = document.createElement("span")
                var bold3 = document.createElement("strong")
                var span5 = document.createElement("span")
                span4.textContent = " " + local1[0] + " "
                bold3.textContent = timeDifference(time)
                span5.textContent = " " + local1[1]
                td5.appendChild(span4)
                td5.appendChild(bold3)
                td5.appendChild(span5)
                tr5.appendChild(td5)
                mainTbody.appendChild(tr5)
            }
            mainTbody.insertBefore(tr1, mainTbody.childNodes[0])
            td05.appendChild(mainTbody)
        }
        //End
        mainLi.appendChild(mainTable)
        return [mainLi, mainTbody]
    } else if (typ == 1) {
        var mainLi = document.createElement("li")
        mainLi.id = name
        var mainTable = document.createElement("table")
        var trof = document.createElement("tr")
        mainTable.style.width = "100%"
        var tdof1 = document.createElement("td")
        trof.appendChild(tdof1)
        if ((containsValue(extraInfo, name)) || (typ == 3)) {
            var tdof2 = document.createElement("td")
            var tdof3 = document.createElement("td")

            tdof2.style.width = "24px"
            tdof2.style.rowSpan = "10"
            tdof2.style.height = "100%"
            tdof2.id = name + "_"

            if (!containsValue(followedStreamers, name)) {
                tdof2.className = "follow"
                follow(tdof2)
                trof.appendChild(tdof2)
            } else {
                tdof2.className = "unfollow"
                unfollow(tdof2)
                tdof3.style.width = "24px"
                tdof3.style.rowSpan = "10"
                tdof3.style.height = "100%"
                tdof3.id = name + "$"
                if (containsValue(mutedChannels, name)) {
                    tdof3.className = "unmute"
                    unmute(tdof3)
                } else {
                    tdof3.className = "mute"
                    mute(tdof3)
                }
                trof.appendChild(tdof2)
                trof.appendChild(tdof3)
            }
            var vidtd = document.createElement("td")
            vidtd.style.width = "24px"
            vidtd.style.rowSpan = "10"
            vidtd.style.height = "100%"
            vidtd.id = name + "*"
            vidtd.className = "video"
            vidsrch(vidtd)
            trof.appendChild(vidtd)
        }
        var mainA = document.createElement("a")
        mainA.id = name + "!"
        mainA.className = "option"
        var span6 = document.createElement("span")
        span6.textContent = name
        span6.className = "offline"
        mainA.appendChild(span6)
        tdof1.appendChild(mainA)
        mainTable.appendChild(trof)
        mainLi.appendChild(mainTable)
        return [mainLi, mainA]
    } else if (typ == 2) {
        var box = name[1]
        var live = name[2]
        var viewers = name[3]
        var channels = name[4]
        name = name[0]

        var mainLi = document.createElement("li")
        mainLi.style.margin = "0px"
        mainLi.style.display = "inline"
        mainLi.id = name
        var mainTable = document.createElement("table")
        mainTable.style.width = "50%"
        mainTable.border = "0"
        mainTable.cellpadding = "4"
        mainTable.cellspacing = "0"
        mainTable.style.display = "inline-block"

        var tr0 = document.createElement("tr")
        var td05 = document.createElement("td")
        tr0.appendChild(td05)

        var extbl = document.createElement("table")
        extbl.style.width = "100%"
        extbl.style.height = "100%"
        var extd = document.createElement("td")
        extd.style.height = "100%"
        extd.style.width = "30px"
        extd.appendChild(extbl)

        var extr0 = document.createElement("tr")

        extr0.style.width = "100%"
        extbl.appendChild(extr0)
        var extr1 = document.createElement("tr")
        var td0 = document.createElement("td")
        td0.style.width = "100%"
        td0.id = name + "&"
        if (!containsValue(followedGames, name)) {
            td0.className = "follow"
            follow2(td0)
        } else {
            td0.className = "unfollow"
            unfollow2(td0)
        }
        extr0.appendChild(td0)
        extr0.style.height = "50%"

        var vidtr = document.createElement("tr")
        var vidtd = document.createElement("td")
        vidtd.style.width = "100%"
        vidtd.id = name + "*"
        vidtd.className = "video"
        vidsrch2(vidtd)
        vidtr.appendChild(vidtd)
        vidtr.style.height = "50%"
        extbl.appendChild(vidtr)

        tr0.appendChild(extd)

        var tr1 = document.createElement("tr")
        var mainTbody = document.createElement("table")
        mainTbody.className = "option"
        mainTbody.id = name + "!"
        mainTbody.style.width = "100%"
        mainTbody.border = "0"
        mainTbody.style.borderSpacing = "0px"
        mainTbody.style.tableLayout = "fixed"
            //Row 1

        box = box.replace("{width}", "56")
        box = box.replace("{height}", "78")
        var td1a = document.createElement("td")
        td1a.style.width = "78px"
        td1a.rowSpan = "10"
        var img1 = document.createElement("div")
        img1.className = "box"
        img1.style.backgroundImage = "url('" + box + "')"
        img1.align = "left"
        td1a.appendChild(img1)
        tr1.appendChild(td1a)

        var td1b = document.createElement("td")
        var img2 = document.createElement("div")
        img2.className = "game"
        img2.style.verticalAlign = "bottom"
        var span1 = document.createElement("span")
        span1.style.wordWrap = "break-word"
        span1.className = (live) ? "online" : "offline"
        var bold1 = document.createElement("strong")
        bold1.style.wordWrap = "break-word"
        bold1.textContent = " " + name + " "
        span1.appendChild(bold1)
        td1b.appendChild(img2)
        td1b.appendChild(span1)
        tr1.appendChild(td1b)

        //Row 2

        if (viewers != null) {
            var tr3 = document.createElement("tr")
            var td3 = document.createElement("td")
            var img5 = document.createElement("div")
            img5.className = "viewers"
            img5.style.verticalAlign = "bottom"
            td3.appendChild(img5)
            var bold2 = document.createElement("span")
            bold2.textContent = " " + insSeparators(viewers)
            td3.appendChild(bold2)
            tr3.appendChild(td3)
            mainTbody.appendChild(tr3)
        }

        //Row 3

        if (channels != null) {
            var tr2 = document.createElement("tr")
            var td2 = document.createElement("td")
            var img4 = document.createElement("div")
            img4.className = "channel"
            img4.style.verticalAlign = "bottom"
            td2.appendChild(img4)
            var span2 = document.createElement("span")
            span2.style.wordWrap = "break-word"

            span2.textContent = " " + insSeparators(channels)
            td2.appendChild(span2)

            tr2.appendChild(td2)
            mainTbody.appendChild(tr2)
        }

        mainTbody.insertBefore(tr1, mainTbody.childNodes[0])
        td05.appendChild(mainTbody)
        mainTable.appendChild(tr0)
            //End
        mainLi.appendChild(mainTable)
        return [mainLi, mainTbody]
    } else if (typ == 3) {
        name = name[0]
        var mainLi = document.createElement("li")
        mainLi.id = name
        var mainTable = document.createElement("table")
        var trof = document.createElement("tr")
        mainTable.style.width = "100%"
        var tdof1 = document.createElement("td")
        trof.appendChild(tdof1)
        var tdof2 = document.createElement("td")
        var tdof3 = document.createElement("td")
        tdof2.style.width = "24px"
        tdof2.style.rowSpan = "10"
        tdof2.style.height = "100%"
        tdof2.className = "unfollow"
        tdof2.id = name + "&"
        unfollow2(tdof2)
        trof.appendChild(tdof2)
        var vidtd = document.createElement("td")
        vidtd.style.width = "24px"
        vidtd.style.rowSpan = "10"
        vidtd.style.height = "100%"
        vidtd.id = name + "*"
        vidtd.className = "video"
        vidsrch(vidtd)
        trof.appendChild(vidtd)
        var mainA = document.createElement("a")
        mainA.id = name + "!"
        mainA.className = "option"
        var span6 = document.createElement("span")
        span6.textContent = name
        span6.className = "offline"
        mainA.appendChild(span6)
        tdof1.appendChild(mainA)
        mainTable.appendChild(trof)
        mainLi.appendChild(mainTable)
        return [mainLi, mainA]
    } else if (typ == 4) {
        var title = name[0]
        var description = name[1]
        var views = name[2]
        var time = name[3]
        var game = name[5]
        var preview = name[6]
        var isHighlight = name[7]
        var link = name[8]
        var length = name[9]
        var display_name = name[10]
        name = name[4]

        var mainLi = document.createElement("li")
        mainLi.style.margin = "0px"
        mainLi.id = name + "|" + link
        var mainTable = document.createElement("table")
        mainTable.style.width = "100%"
        mainTable.border = "0"
        mainTable.cellpadding = "4"
        mainTable.cellspacing = "0"

        var tr0 = document.createElement("tr")
        mainTable.appendChild(tr0)
        var td05 = document.createElement("td")

        if (containsValue(bigPreviews, link)) {
            tr0.style.width = "0px"
            mainTable.style.tableLayout = "fixed"
            var td1b = document.createElement("table")
            var mainDiv = document.createElement("div")
            mainDiv.style.whiteSpace = "nowrap"
            mainDiv.style.maxWidth = "429px"
            mainDiv.style.overflow = "hidden"
            var mainTbody = document.createElement("table")
            mainTbody.className = "option"
            mainTbody.id = name + "!"
            td1b.style.whiteSpace = "nowrap"
            var img2 = document.createElement("div")
            img2.className = "vid"
            img2.style.verticalAlign = "bottom"
            var span1 = document.createElement("span")
            span1.className = (isHighlight) ? "online" : "offline"
            var bold1 = document.createElement("strong")
            bold1.textContent = " " + title + " "
            span1.appendChild(bold1)
            mainTbody.appendChild(img2)
            mainTbody.appendChild(span1)
            var img7 = document.createElement("div")
            img7.className = "game"
            img7.style.verticalAlign = "bottom"
            mainTbody.appendChild(img7)
            var span4 = document.createElement("strong")
            span4.style.overflow = "hidden"
            if ((game == "!null!") || (game == "")) {
                var ital2 = document.createElement("i")
                span4.textContent = " None"
                ital2.appendChild(span4)
                mainTbody.appendChild(ital2)
            } else {
                span4.textContent = " " + game
                mainTbody.appendChild(span4)
            }
            mainDiv.appendChild(mainTbody)
            td1b.appendChild(mainDiv)
            tr0.appendChild(td1b)
            var tr05 = document.createElement("tr")
            mainTable.appendChild(tr05)
            var td1c = document.createElement("td")
            td1c.rowSpan = "10"
            var img3 = document.createElement("div")
            img3.id = link + "?"
            var unix = new Date().getTime()
            unix = Math.ceil(unix / 1000)
            unix = Math.ceil(unix / previewWait)
            img3.className = "preview"
            previewTog(img3)
            img3.style.backgroundImage = "url('" + preview + "')"
            img3.style.backgroundSize = "458px 344px"
            img3.style.backgroundPosition = "0px 50%"
            img3.style.width = "458px"
            img3.style.height = "258px"
            img3.align = "left"
            img3.style.position = "relative"
            img3.style.left = "1px"
            td1c.appendChild(img3)
            tr05.appendChild(td1c)
                //tr1.appendChild(td1c)
        } else {
            mainTable.style.borderSpacing = "0px"
            tr0.appendChild(td05)
            var td1c = document.createElement("td")
            td1c.rowSpan = "10"
            var img3 = document.createElement("div")
            img3.id = link + "?"
            img3.className = "preview"
            previewTog(img3)
            img3.style.backgroundImage = "url('" + preview + "')"
            img3.style.backgroundSize = "139px 104px"
            img3.style.backgroundPosition = "0px 50%"
            img3.style.width = "139px"
            img3.style.height = "78px"
            img3.align = "right"
            td1c.appendChild(img3)
            tr0.appendChild(td1c)
                //tr1.appendChild(td1c)
            if (containsValue(extraInfo, link)) {
                var btntbl = document.createElement("table")
                btntbl.style.width = "30px"
                btntbl.style.height = "100%"
                var btntd = document.createElement("td")
                btntd.appendChild(btntbl)
                btntd.style.height = "100%"
                btntd.style.width = "30px"
                var btnr0 = document.createElement("tr")
                btnr0.style.height = "33%"
                var btnd0 = document.createElement("td")
                btnd0.style.width = "30px"
                btnd0.className = "twitch"
                openTabVid_(btnd0)
                btnr0.appendChild(btnd0)
                btntbl.appendChild(btnr0)
                var btnr1 = document.createElement("tr")
                btnr1.style.height = "33%"
                var btnd1 = document.createElement("td")
                btnd1.style.width = "30px"
                btnd1.className = "live"
                openLiveVid_(btnd1)
                btnr1.appendChild(btnd1)
                btntbl.appendChild(btnr1)
                var btnr2 = document.createElement("tr")
                btnr2.style.height = "33%"
                var btnd2 = document.createElement("td")
                btnd2.style.width = "30px"
                btnd2.className = "gochannel"
                openChannel_(btnd2)
                btnr2.appendChild(btnd2)
                btntbl.appendChild(btnr2)
                tr0.appendChild(btntd)
            }
            var tr1 = document.createElement("tr")
            var mainTbody = document.createElement("table")
            mainTbody.className = "option"
            mainTbody.id = mainLi.id + "!"
            mainTbody.style.width = "100%"
            mainTbody.border = "0"
            mainTbody.style.borderSpacing = "0px"
            mainTbody.style.tableLayout = "fixed"
                //Row 1
            var td1b = document.createElement("td")
                //td1b.style.whiteSpace = "nowrap"
            var img2 = document.createElement("div")
            img2.className = "vid"
            img2.style.verticalAlign = "bottom"
            var span1 = document.createElement("span")
            span1.style.wordWrap = "break-word"
            if ((link == errorCause) && liveError) {
                span1.textContent = " Livestreamer Path Error!"
                span1.style.color = "Red"
                span1.style.fontWeight = "bold"
                td2.appendChild(span2)
            } else {
                span1.className = (isHighlight) ? "online" : "offline"
                var bold1 = document.createElement("strong")
                bold1.textContent = " " + title + " "
                span1.appendChild(bold1)
                var span15 = document.createElement("span")
                span15.textContent = description != "" ? '"' + description + '"' : ""
                span1.appendChild(span15)
            }
            td1b.appendChild(img2)
            td1b.appendChild(span1)
            tr1.appendChild(td1b)
                //Row 2
            var tr2 = document.createElement("tr")
            var td2 = document.createElement("td")
            var img4 = document.createElement("div")
            img4.className = "streamer"
            img4.style.verticalAlign = "bottom"
            td2.appendChild(img4)
            var span2 = document.createElement("span")
            span2.style.wordWrap = "break-word"
            span2.textContent = " " + display_name
            span2.style.fontWeight = "bold"
            td2.appendChild(span2)
            tr2.appendChild(td2)
            mainTbody.appendChild(tr2)
                //Row 3
            var tr3 = document.createElement("tr")
            var td3 = document.createElement("td")
            var img5 = document.createElement("div")
            img5.className = "game"
            img5.style.verticalAlign = "bottom"
            td3.appendChild(img5)
            var bold2 = document.createElement("strong")
            if ((game == "!null!") || (game == "")) {
                var ital2 = document.createElement("i")
                bold2.textContent = " None"
                ital2.appendChild(bold2)
                td3.appendChild(ital2)
            } else {
                bold2.textContent = " " + game
                td3.appendChild(bold2)
            }
            tr3.appendChild(td3)
            mainTbody.appendChild(tr3)
                //Row 4
            var tr4 = document.createElement("tr")
            var td4 = document.createElement("td")
            var img45 = document.createElement("div")
            img45.className = "views"
            img45.style.verticalAlign = "bottom"
            td4.appendChild(img45)
            var span45 = document.createElement("span")
            span45.textContent = " " + insSeparators(views)
            td4.appendChild(span45)
            tr4.appendChild(td4)
            mainTbody.appendChild(tr4)
                //Row 4.5

            var tr45 = document.createElement("tr")
            var td45 = document.createElement("td")
            var img475 = document.createElement("div")
            img475.className = "time"
            img475.style.verticalAlign = "bottom"
            td45.appendChild(img475)
            var span475 = document.createElement("span")
            span475.style.fontWeight = "bold"
            span475.textContent = " " + secToTime(String(length))
            td45.appendChild(span475)
            tr45.appendChild(td45)
            mainTbody.appendChild(tr45)

            //Row 5
            var tr5 = document.createElement("tr")
            var td5 = document.createElement("td")
            var img7 = document.createElement("div")
            img7.className = "channel"
            img7.style.verticalAlign = "bottom"
            td5.appendChild(img7)
            var span4 = document.createElement("span")
            var bold3 = document.createElement("strong")
            span4.textContent = " " + local1[2] + " "
            bold3.textContent = createDate(time)
            td5.appendChild(span4)
            td5.appendChild(bold3)
            tr5.appendChild(td5)
            mainTbody.appendChild(tr5)

            mainTbody.insertBefore(tr1, mainTbody.childNodes[0])
            td05.appendChild(mainTbody)
        }

        //End
        mainLi.appendChild(mainTable)
        return [mainLi, mainTbody]
    }
}

function updateList() {
    if (videoFollows && authName == "") {
        videoFollows = false
    }
    if (twitchMode == null) {
        if (followedStreamers.length > 0) {
            twitchMode = false
            document.getElementById("!twitchmode").className = "switch"
        } else {
            twitchMode = true
            document.getElementById("!twitchmode").className = "exit"
        }
        document.getElementById("!twitchmode").style.display = "block"
    }
    if (twitchMode) {
        document.getElementById("!searchs").style.display = "none"
        document.getElementById("!followsearch").style.display = "none"
        document.getElementById("!twitchmode").className = "exit"
        if (authName != "") {
            document.getElementById("!connects").style.display = "none"
            document.getElementById("!loggedin").style.display = "inline-block"
            document.getElementById("!logouts").style.display = "inline-block"
            document.getElementById("!authname").textContent = authName
        } else {
            document.getElementById("!connects").style.display = "inline-block"
            document.getElementById("!loggedin").style.display = "none"
            document.getElementById("!logouts").style.display = "none"
        }
    } else {
        document.getElementById("!loggedin").style.display = "none"
        document.getElementById("!logouts").style.display = "none"
        document.getElementById("!connects").style.display = "none"
        document.getElementById("!searchs").style.display = "inline-block"
        document.getElementById("!followsearch").style.display = "inline-block"
        document.getElementById("!twitchmode").className = "switch"
    }

    menu5.parentNode.style.display = ((mode == 1 && !(searchHistory.length > 0)) || (mode == 3 && authName != "")) ? "inline" : "none"
    document.getElementById("!gamefollowsbr").style.display = ((mode == 1 && !(searchHistory.length > 0)) || (mode == 3 && authName != "")) ? "inline" : "none"

    if (alarmOn) {
        addon.port.emit("endAlarm", "End the alarm!")
    }
    document.getElementById("!csslink").href = (darkMode) ? "dark.css" : "light.css"
    if (((gameInfo.length + offlineGames.length) < followedGames.length) && mode == 1) {
        startRotation()
    }
    if (((mode == 0) || (mode == 1 && (followedGames.length < 1 || !((gameInfo.length + offlineGames.length) < followedGames.length)) && (topGames.length > 0)) || (mode == 2 && (topStreams.length > 0)) || (mode == 3 && (topVideos.length > 0))) && !authStart && !searchingTwitch) {
        endRotation()
    }
    if (authUpdate) {
        authStart = false
        authUpdate = false
        endRotation()
    }
    var headers = [document.getElementById("!online"), document.getElementById("!offline")]

    document.getElementById("!noresults").style.display = "none"
    document.getElementById("!nochannels").style.display = "none"
    document.getElementById("!novids").style.display = "none"
    document.getElementById("!sscrolldown").style.display = "inline"

    oncounter.style.display = "none"
    oncounter.textContent = onlineInfo.length

    //Delete stuff we don't need
    for (var key in headers) {
        while (headers[key].firstChild) {
            headers[key].removeChild(headers[key].firstChild)
        }
    }

    if (menuOpen && (!(searchHistory.length > 0))) {
        //0=followed channels, 1=games, 2=channels
        if (mode == 0) {
            menu2.className = "games"
            menu3.className = "channels"
            menu4.className = "videos"
        } else if (mode == 1) {
            menu2.className = "followed"
            menu3.className = "channels"
            menu4.className = "videos"
            oncounter.style.display = "inline"
            oncounter.style.bottom = "-26px"
        } else if (mode == 2) {
            menu2.className = "followed"
            menu3.className = "games"
            menu4.className = "videos"
            oncounter.style.display = "inline"
            oncounter.style.bottom = "-26px"
        } else if (mode == 3) {
            menu2.className = "followed"
            menu3.className = "games"
            menu4.className = "channels"
            oncounter.style.display = "inline"
            oncounter.style.bottom = "-26px"
        }
        menu2.parentNode.style.display = "inline"
        menu3.parentNode.style.display = "inline"
        menu4.parentNode.style.display = "inline"
    } else {
        menu2.parentNode.style.display = "none"
        menu3.parentNode.style.display = "none"
        menu4.parentNode.style.display = "none"
    }
    if (mode == 0) {
        //Followed channel mode
        menuButton.className = "followed"
        oncounter.style.display = "inline"
        oncounter.style.bottom = "7px"
        document.getElementById("!followsearch").placeholder = local3[0]

        //Split the interface into two modes, searching and not searching
        if ((searchHistory.length > 0)) {
            var srcht = searchHistory[searchHistory.length - 1][0]
            if (srcht == 0) {
                if (searchResult != null) {
                    for (var key in searchResult) {
                        var newCard = generateCard(0, searchResult[key])
                        var listElement = newCard[0]
                        var clickElement = newCard[1]
                        document.getElementById("!offline").appendChild(listElement)
                        if (searchResult[key][6] != null) {
                            onClick(clickElement, 0)
                        } else {
                            onClick(clickElement, 1)
                        }
                        onRightClick(clickElement)
                    }
                } else if (!noResults) {
                    var target2 = searchTarget.replace(/\W/g, '')
                    var newCard = generateCard(1, target2)
                    var listElement = newCard[0]
                    var clickElement = newCard[1]

                    document.getElementById("!offline").appendChild(listElement)
                    onClick(clickElement, 1)
                    onRightClick(clickElement)
                }
            } else if (srcht > 3 && !searchingTwitch) {
                if (searchResult != null && !noResults) {
                    for (var key in searchResult) {
                        var newCard = generateCard(4, searchResult[key])
                        var listElement = newCard[0]
                        var clickElement = newCard[1]
                        document.getElementById("!offline").appendChild(listElement)
                        onVideoClick(clickElement)
                        onRightClickVid(clickElement)
                    }
                }
            }
        } else {
            //Create online streamers for list...
            for (var key in onlineInfo) {
                if (containsValue(followedStreamers, onlineInfo[key][0])) {
                    var newCard = generateCard(0, onlineInfo[key])
                    var listElement = newCard[0]
                    var clickElement = newCard[1]

                    document.getElementById("!online").appendChild(listElement)
                    onClick(clickElement, 0)
                    onRightClick(clickElement)
                }
            }
            //Create offline streamers for list...
            if (!offlineHide) {
                for (var key in offlineStreamers) {
                    if (offlineStreamers[key] != "") {
                        if (containsValue(followedStreamers, offlineStreamers[key])) {
                            var newCard = generateCard(1, offlineStreamers[key])
                            var listElement = newCard[0]
                            var clickElement = newCard[1]
                            document.getElementById("!offline").appendChild(listElement)
                            onClick(clickElement, 1)
                            onRightClick(clickElement)
                        }
                    }
                }
            }
        }
    } else if (mode == 1 && !searchingTwitch) {
        //Game mode
        menuButton.className = "games"
        document.getElementById("!followsearch").placeholder = local3[1]
        menu5.className = (gameFollows) ? "gamefollows2" : "gamefollows"
        if (searchHistory.length > 0 && !noResults) {
            var srcht = searchHistory[searchHistory.length - 1][0]
            if (srcht > 3) {
                if (srcht == 5) {
                    document.getElementById("!sscrolldown").style.display = "none"
                }
                for (var key in searchResult) {
                    var newCard = generateCard(4, searchResult[key])
                    var listElement = newCard[0]
                    var clickElement = newCard[1]
                    document.getElementById("!offline").appendChild(listElement)
                    onVideoClick(clickElement)
                    onRightClickVid(clickElement)
                }
            } else if (srcht == 3) {

                for (var key in searchResult) {
                    var newCard = generateCard(0, searchResult[key])
                    var listElement = newCard[0]
                    var clickElement = newCard[1]
                    document.getElementById("!offline").appendChild(listElement)
                    onClick(clickElement, 0)
                    onRightClick(clickElement)
                }
            } else {
                for (var key in searchResult) {
                    var newCard = generateCard(2, searchResult[key])
                    var listElement = newCard[0]
                    var clickElement = newCard[1]
                    document.getElementById("!offline").appendChild(listElement)
                    onClick2(clickElement)
                        //onRightClick3(document.getElementById(searchedElement.id + "!"))
                }
            }
        } else if (!(searchHistory.length > 0)) {
            if (gameFollows) {
                for (var key in gameInfo) {
                    if (gameInfo[key][2]) {
                        var newCard = generateCard(2, gameInfo[key])
                        var listElement = newCard[0]
                        var clickElement = newCard[1]
                        document.getElementById("!online").appendChild(listElement)
                        onClick2(clickElement)
                            //onRightClick3(document.getElementById(searchedElement.id + "!"))
                    }
                }
                offlineGames = offlineGames.sort()
                for (var key in offlineGames) {
                    var newName = [offlineGames[key]]
                    var newCard = generateCard(3, newName)
                    var listElement = newCard[0]
                    var clickElement = newCard[1]
                    document.getElementById("!online").appendChild(listElement)
                    onClick2(clickElement)
                        //onRightClick3(document.getElementById(searchedElement.id + "!"))
                }
            } else {
                for (var key in topGames) {
                    var newCard = generateCard(2, topGames[key])
                    var listElement = newCard[0]
                    var clickElement = newCard[1]
                    document.getElementById("!offline").appendChild(listElement)
                    onClick2(clickElement)
                        //onRightClick3(document.getElementById(searchedElement.id + "!"))
                }
            }
        }
    } else if (mode == 2 && !searchingTwitch) {
        //Channel mode
        menuButton.className = "channels"
        document.getElementById("!followsearch").placeholder = local3[2]

        if ((searchHistory.length > 0) && !searchingTwitch) {
            var srcht = searchHistory[searchHistory.length - 1][0]
            if (srcht == 2) {
                for (var key in searchResult) {
                    var newCard = generateCard(0, searchResult[key])
                    var listElement = newCard[0]
                    var clickElement = newCard[1]
                    document.getElementById("!offline").appendChild(listElement)
                    onClick(clickElement, 0)
                    onRightClick(clickElement)
                }
            } else if (srcht == 4) {
                if (!noResults) {
                    for (var key in searchResult) {
                        var newCard = generateCard(4, searchResult[key])
                        var listElement = newCard[0]
                        var clickElement = newCard[1]
                        document.getElementById("!offline").appendChild(listElement)
                        onVideoClick(clickElement)
                        onRightClickVid(clickElement)
                    }
                }
            }

        } else {
            for (var key in topStreams) {
                var newCard = generateCard(0, topStreams[key])
                var listElement = newCard[0]
                var clickElement = newCard[1]
                document.getElementById("!offline").appendChild(listElement)
                onClick(clickElement, 0)
                onRightClick(clickElement)
            }
        }
    } else if (mode == 3 && !searchingTwitch) {
        //Video mode
        document.getElementById("!followsearch").placeholder = local3[3]
        document.getElementById("!searchs").style.display = "none"
        document.getElementById("!sscrolldown").style.display = "none"
        menu5.className = (videoFollows) ? "videofollows2" : "videofollows"
        menuButton.className = "videos"
        if (videoFollows) {
            for (var key in videoInfo) {
                var newCard = generateCard(4, videoInfo[key])
                var listElement = newCard[0]
                var clickElement = newCard[1]
                document.getElementById("!offline").appendChild(listElement)
                onVideoClick(clickElement)
                onRightClickVid(clickElement)
            }
        } else {
            for (var key in topVideos) {
                var newCard = generateCard(4, topVideos[key])
                var listElement = newCard[0]
                var clickElement = newCard[1]
                document.getElementById("!offline").appendChild(listElement)
                onVideoClick(clickElement)
                onRightClickVid(clickElement)
            }
        }
    }
    if ((searchHistory.length > 0)) {
        menuOpen = false
        menuButton.className = "back"
        oncounter.style.display = "none"
    }
    performSearch()
}

function searchTwitch(typ, term) {
    var term2 = term
    if (term2 != null) {
        term3 = ((term2.replace(/ /g, "")).toLowerCase()).replace(/\W/g, '')
        if (term3 == "") {
            endSearch("Invalid search")
        } else {
            if (typ <= 2) {
                endSearch("New search being made", true)
            }
            startRotation()
            searchTarget = term2
            searchHistory.push([typ, searchTarget])
            searchingTwitch = true
            updateList()
            addon.port.emit("searchTwitch", [term2, typ])
        }
    } else {
        endSearch("Invalid search")
    }
}

addon.port.on("searchedChannel", function (payload) {
    scrollers0 = payload[1][0]
    scrollers1 = payload[1][1]
    scrollers2 = payload[1][2]
    payload = payload[0]
    if (payload != null) {
        if (payload.length > 0) {
            searchResult = payload
            searchingTwitch = false
            endRotation()
            updateList()
        } else {
            endSearch("Search result was null: Empty array", false, true)
        }
    } else {
        endSearch("Search result was null: Null")
    }
})

addon.port.on("changeMode", function (payload) {
    mode = payload
    modeChange()
    endSearch("Message received from main")
})

addon.port.on("authStart", function () {
    startRotation();
    authStart = true;
    updateList()
})

addon.port.on("authEnd", function () {
    authUpdate = true;
    updateList()
})

addon.port.on("updatePage", function (payload) {
    //console.log("Payload received")
    onlineInfo = payload[0]
    offlineStreamers = payload[1]
    alarmOn = payload[2]
    followedStreamers = payload[3]
    hideLogo = payload[4]
    offlineHide = payload[5]
    openTab = payload[6]
    useLive = payload[7]
    openChat = payload[8]
    previewWait = payload[9]
    tutorial = payload[10]
    alarmCause = payload[11]
    liveError = payload[12]
    errorCause = payload[13]
    hidePreview = payload[14]
    local1 = payload[15]
    local2 = payload[16]
    local3 = payload[17]
    darkMode = payload[18]
    topGames = payload[19]
    topStreams = payload[20]
    followedGames = payload[21]
    gameInfo = payload[22]
    scrollers0 = payload[23]
    scrollers1 = payload[24]
    mutedChannels = payload[25]
    offlineGames = payload[26]
    authName = payload[27]
    scrollers2 = payload[28]
    topVideos = payload[29]
    videoInfo = payload[30]

    updateList()
})