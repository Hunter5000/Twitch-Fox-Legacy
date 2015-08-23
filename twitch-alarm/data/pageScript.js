//Imported variables
onlineStreamers = null
onlineGames = null
onlineTitles = null
onlineViewers = null
onlineAvatars = null
onlineTimes = null
offlineStreamers = null
alarmOn = null
defaultHidden = null
offlineHide = null
sortingMethod = null
followedStreamers = null
previewWait = null
openTab = null
useLive = null
openChat = null
tutorial = null
alarmCause = null
liveError = null
errorCause = null
hideShowHide = null
local1 = null
local2 = null

//Unique variables

hiddenStreamers = []
searchTerm = ""
searchOn = 0
searchOff = 0

function onClick(obj) {
    obj.onclick = function() {
        var actname = (obj.id.substring(0, obj.id.length - 1))
        if (containsValue(onlineStreamers, actname)) {
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
        } else {
            addon.port.emit("openTab", actname)
        }
    }
}

function onRightClick(obj) {
    var objname = obj.id.substring(0, obj.id.length - 1)
    if (obj.parentNode.id == "!last") {
        return
    }
    obj.oncontextmenu = function() {
        if (!containsValue(hiddenStreamers, objname)) {
            hiddenStreamers.unshift(objname)
        } else {
            var namekey = hiddenStreamers.indexOf(objname)
            hiddenStreamers.splice(namekey, 1)
        }
        updateList()
    }
}

function containsValue(list_, obj) {
    if ((list_.indexOf(obj)) > -1) {
        return true
    } else {
        return false
    }
}

document.getElementById("!settings").onclick = function() {
    addon.port.emit("openSettings")
}

document.getElementById("!showhide").onclick = function() {
    if (defaultHidden) {
        for (var key in onlineStreamers) {
            if (!containsValue(hiddenStreamers, onlineStreamers[key])) {
                hiddenStreamers.unshift(onlineStreamers[key])
            }
        }
    } else {
        for (var key in onlineStreamers) {
            if (containsValue(hiddenStreamers, onlineStreamers[key])) {
                var namekey = hiddenStreamers.indexOf(onlineStreamers[key])
                hiddenStreamers.splice(namekey, 1)
            }
        }
    }
    updateList()
}

document.getElementById("!showhide").oncontextmenu = function() {
    if (!defaultHidden) {
        for (var key in onlineStreamers) {
            if (!containsValue(hiddenStreamers, onlineStreamers[key])) {
                hiddenStreamers.unshift(onlineStreamers[key])
            }
        }
    } else {
        for (var key in onlineStreamers) {
            if (containsValue(hiddenStreamers, onlineStreamers[key])) {
                var namekey = hiddenStreamers.indexOf(onlineStreamers[key])
                hiddenStreamers.splice(namekey, 1)
            }
        }
    }
    updateList()
}

function performSearch() {
    searchOff = 0
    searchOn = 0
    for (var key in offlineStreamers) {
        if (document.getElementById(offlineStreamers[key])) {
            if (offlineStreamers[key].toLowerCase().search(searchTerm) != -1) {
                var elem = document.getElementById(offlineStreamers[key])
                elem.style.display = "inline"
                searchOff += 1
            } else {
                var elem = document.getElementById(offlineStreamers[key])
                elem.style.display = "none"
            }

        }
    }

    for (var key in onlineStreamers) {
        if (document.getElementById(onlineStreamers[key])) {
            if ((onlineStreamers[key].toLowerCase().search(searchTerm) != -1) || (onlineGames[key].toLowerCase().search(searchTerm) != -1) || (onlineTitles[key].toLowerCase().search(searchTerm) != -1)) {
                var elem = document.getElementById(onlineStreamers[key])
                elem.style.display = "inline"
                searchOn += 1
            } else {
                var elem = document.getElementById(onlineStreamers[key])
                elem.style.display = "none"
            }
        }
    }

    if (searchOff > 0) {
        document.getElementById("!offlinespan").style.display = "inline"
    } else {
        document.getElementById("!offlinespan").style.display = "none"
    }

    if (searchOn > 0) {
        document.getElementById("!onlinespan").style.display = "inline"
    } else {
        document.getElementById("!onlinespan").style.display = "none"
    }

    if ((searchOn > 0) && (searchOff > 0)) {
        document.getElementById("!onoffdiv").style.display = "inline"
    } else {
        document.getElementById("!onoffdiv").style.display = "none"
    }

    if (searchOn == onlineStreamers.length) {
        document.getElementById("!onlinep1").textContent = " (" + onlineStreamers.length + ")"
        document.getElementById("!onlinep2").style.display = "none"
        document.getElementById("!onlinep3").textContent = ""
    } else if (searchOn != onlineStreamers.length) {
        document.getElementById("!onlinep1").textContent = " (" + onlineStreamers.length + " "
        document.getElementById("!onlinep2").style.display = "inline"
        document.getElementById("!onlinep3").textContent = " " + searchOn + ")"
    }

    if (searchOff == offlineStreamers.length) {
        document.getElementById("!offlinep1").textContent = " (" + offlineStreamers.length + ")"
        document.getElementById("!offlinep2").style.display = "none"
        document.getElementById("!offlinep3").textContent = ""

    } else if (searchOff != offlineStreamers.length) {
        document.getElementById("!offlinep1").textContent = " (" + offlineStreamers.length + " "
        document.getElementById("!offlinep2").style.display = "inline"
        document.getElementById("!offlinep3").textContent = " " + searchOff + ")"
    }

}

document.getElementById("!followsearch").oninput = function() {
    searchTerm = document.getElementById("!followsearch").value.toLowerCase()
    performSearch()
}

document.getElementById("!forcerefresh").onmouseover = function() {
    document.getElementById("!forcerefresh").style.opacity = 1
}

document.getElementById("!forcerefresh").onclick = function() {
    addon.port.emit("forceRefresh")
}

document.getElementById("!forcerefresh").onmouseout = function() {
    document.getElementById("!forcerefresh").style.opacity = 0.6
}

function genTime(time) {
    var curUTC = Date.now()
    timeDif = curUTC - time
    var difHrs = Math.floor(timeDif / 3600000)
    timeDif = timeDif - (difHrs * 3600000)
    var difMns = Math.floor(timeDif / 60000)
    timeDif = timeDif - (difMns * 60000)
    var difScs = Math.floor(timeDif / 1000)
    if (difHrs == 0) {
        difHrs = ""
    } else {
        difHrs = difHrs + ":"
    }
    if ((difMns < 10) && (difHrs != 0)) {
        difMns = "0" + difMns + ":"
    } else {
        difMns = difMns + ":"
    }
    if (difScs < 10) {
        difScs = "0" + difScs
    } else {
        difScs = difScs
    }
    return difHrs + difMns + difScs
}

function insSeparators(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, local2);
}

function generateCard(status, name) {
    //0 = last streamer, 1 = normal online streamer, 2 = offline streamer
    if (status == 2) {
        var mainLi = document.createElement("li")
        mainLi.id = name
        var mainA = document.createElement("a")
        mainA.id = name + "!"
        mainA.className = "option"
        mainA.textContent = name
        mainA.style.color = "OrangeRed"
        mainLi.appendChild(mainA)
        return mainLi
    } else {
        var namekey = onlineStreamers.indexOf(name)
        var game = onlineGames[namekey]
        var title = onlineTitles[namekey]
        var viewers = onlineViewers[namekey]
        var avatar = onlineAvatars[namekey]
        var time = onlineTimes[namekey]
        if (avatar == null) {
            avatar = "http://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_150x150.png"
        }
        if (((containsValue(hiddenStreamers, name) && !defaultHidden) || (!containsValue(hiddenStreamers, name) && defaultHidden)) && (status == 1)) {
            var mainLi = document.createElement("li")
            mainLi.id = name
            var mainA = document.createElement("a")
            mainA.id = name + "!"
            mainA.className = "option"
            mainA.textContent = name
            mainA.style.color = "DodgerBlue"
            mainLi.appendChild(mainA)
            return mainLi
        }
        var mainLi = document.createElement("li")
        mainLi.id = name
        var mainA = document.createElement("a")
        mainA.className = "option"
        mainA.id = name + "!"
        var mainTable = document.createElement("table")
        if (status == 0) {
            mainLi.id = "!last"
            mainTable.style.backgroundColor = "GoldenRod"
        }
        if ((status == 1) && (namekey != onlineStreamers.length - 1)) {
            mainTable.style.borderBottom = "1px solid"
        }
        mainTable.style.width = "100%"
        mainTable.border = "0"
        mainTable.cellpadding = "4"
        mainTable.cellspacing = "0"
        var mainTbody = document.createElement("tbody")
            //Row 1
        var tr1 = document.createElement("tr")
        var td1a = document.createElement("td")
        td1a.style.width = "90px"
        td1a.rowSpan = "5"
        var img1 = document.createElement("img")
        img1.alt = ""
        img1.height = "90"
        img1.src = avatar
        img1.width = "90"
        img1.align = "left"
        td1a.appendChild(img1)
        tr1.appendChild(td1a)
        var td1b = document.createElement("td")
        var img2 = document.createElement("img")
        img2.alt = ""
        img2.src = "streamer.png"
        img2.style.verticalAlign = "bottom"
        var span1 = document.createElement("span")
        span1.style.color = "DodgerBlue"
        var bold1 = document.createElement("strong")
        bold1.textContent = " " + name
        span1.appendChild(bold1)
        td1b.appendChild(img2)
        td1b.appendChild(span1)
        tr1.appendChild(td1b)
        var td1c = document.createElement("td")
        td1c.rowSpan = "5"
        var img3 = document.createElement("img")
        img3.alt = ""
        img3.height = "90"
        var unix = new Date().getTime()
        unix = Math.ceil(unix / 1000)
        unix = Math.ceil(unix / previewWait)
        img3.src = "http://static-cdn.jtvnw.net/previews-ttv/live_user_" + name + "-160x90.jpg?" + String(unix)
        img3.width = "160"
        img3.align = "right"
        td1c.appendChild(img3)
        tr1.appendChild(td1c)
            //Row 2
        var tr2 = document.createElement("tr")
        var td2 = document.createElement("td")
        var img4 = document.createElement("img")
        img4.alt = ""
        img4.src = "channel.png"
        img4.style.verticalAlign = "bottom"
        td2.appendChild(img4)
        var span2 = document.createElement("span")
        if ((name == errorCause) && liveError) {
            span2.textContent = " Livestreamer Path Error!"
            span2.style.color = "Red"
            span2.style.fontWeight = "bold"
            td2.appendChild(span2)
        } else {
            if (title != "") {
                span2.textContent = ' "' + title + '"'
                td2.appendChild(span2)
            } else {
                var ital1 = document.createElement("i")
                span2.textContent = " Untitled Broadcast"
                ital1.appendChild(span2)
                td2.appendChild(ital1)
            }
        }
        tr2.appendChild(td2)
            //Row 3
        var tr3 = document.createElement("tr")
        var td3 = document.createElement("td")
        var img5 = document.createElement("img")
        img5.alt = ""
        img5.src = "game.png"
        img5.style.verticalAlign = "bottom"
        td3.appendChild(img5)
        var bold2 = document.createElement("strong")
        if (game != "!null!") {
            bold2.textContent = " " + game
            td3.appendChild(bold2)
        } else {
            var ital2 = document.createElement("i")
            bold2.textContent = " None"
            ital2.appendChild(bold2)
            td3.appendChild(ital2)
        }
        tr3.appendChild(td3)
            //Row 4
        var tr4 = document.createElement("tr")
        var td4 = document.createElement("td")
        var img6 = document.createElement("img")
        img6.alt = ""
        img6.src = "viewers.png"
        img6.style.verticalAlign = "bottom"
        td4.appendChild(img6)
        var span3 = document.createElement("span")
        span3.textContent = " " + insSeparators(viewers)
        td4.appendChild(span3)
        tr4.appendChild(td4)
            //Row 5
        var tr5 = document.createElement("tr")
        var td5 = document.createElement("td")
        var img7 = document.createElement("img")
        img7.alt = ""
        img7.src = "time.png"
        img7.style.verticalAlign = "bottom"
        td5.appendChild(img7)
        var span4 = document.createElement("span")
        span4.textContent = " " + local1[0] + " " + genTime(time) + " " + local1[1]
        td5.appendChild(span4)
        tr5.appendChild(td5)
            //End
        mainTbody.appendChild(tr2)
        mainTbody.appendChild(tr3)
        mainTbody.appendChild(tr4)
        mainTbody.appendChild(tr5)
        mainTbody.insertBefore(tr1, mainTbody.childNodes[0])
        mainTable.appendChild(mainTbody)
        mainA.appendChild(mainTable)
        mainLi.appendChild(mainA)
        return mainLi
    }
}

function updateList() {
    var alarmbtn = null
    var headers = [document.getElementById("!online"), document.getElementById("!offline")]
    if (onlineStreamers.length > 0) {
        if (tutorial) {
            document.getElementById("!tutorial1").style.display = "inline"
        } else {
            document.getElementById("!tutorial1").style.display = "none"
        }
        document.getElementById("showhide!!").style.display = "inline"
    } else {
        document.getElementById("showhide!!").style.display = "none"
        document.getElementById("!tutorial1").style.display = "none"
    }

    if (hideShowHide) {
        document.getElementById("showhide!!").style.display = "none"
    }

    if (sortingMethod == "viewers") {
        var newNames = []
        var newGames = []
        var newTitles = []
        var newAvatars = []
        var newTimes = []
        for (var key in newViewers) {
            newViewers[key] = Number(newViewers[key])
        }
        var newViewers = onlineViewers.concat().sort(function(a, b) {
            return b - a
        })
        var newViewers2 = newViewers
        var leng = newViewers.length
        for (i = 0; i < leng; i++) {
            var namekey = onlineViewers.indexOf(newViewers[i])
            newNames.push(onlineStreamers[namekey])
            newGames.push(onlineGames[namekey])
            newTitles.push(onlineTitles[namekey])
            newAvatars.push(onlineAvatars[namekey])
            newTimes.push(onlineTimes[namekey])
            onlineViewers[namekey] = "none"
        }
        onlineStreamers = newNames
        onlineGames = newGames
        onlineAvatars = newAvatars
        onlineTitles = newTitles
        onlineTimes = newTimes
        onlineViewers = newViewers2
    } else {
        var newNames = []
        var newGames = []
        var newTitles = []
        var newAvatars = []
        var newViewers = []
        for (var key in newTimes) {
            newTimes[key] = Number(newTimes[key])
        }
        var newTimes = onlineTimes.concat().sort(function(a, b) {
            return b - a
        })
        var newTimes2 = newTimes
        var leng = newTimes.length
        for (i = 0; i < leng; i++) {
            var namekey = onlineTimes.indexOf(newTimes[i])
            newNames.push(onlineStreamers[namekey])
            newGames.push(onlineGames[namekey])
            newTitles.push(onlineTitles[namekey])
            newAvatars.push(onlineAvatars[namekey])
            newViewers.push(onlineViewers[namekey])
            onlineTimes[namekey] = "none"
        }
        onlineStreamers = newNames
        onlineGames = newGames
        onlineAvatars = newAvatars
        onlineTitles = newTitles
        onlineViewers = newViewers
        onlineTimes = newTimes2
    }

    if (offlineHide) {
        document.getElementById("!onlinespan").style.display = "none"
        document.getElementById("!offlinespan").style.display = "none"
    } else {
        document.getElementById("!onlinespan").style.display = "inline"
        document.getElementById("!offlinespan").style.display = "inline"
    }
    for (var key in headers) {
        while (headers[key].firstChild) {
            headers[key].removeChild(headers[key].firstChild)
        }
    }
    for (var key in hiddenStreamers) {
        if (!containsValue(onlineStreamers, hiddenStreamers[key])) {
            hiddenStreamers.splice(key, 1)
        }
    }
    if (alarmOn) {
        if (!document.getElementById("!break")) {
            var alarmhead = document.createElement("h1")
            var breakElement = document.createElement("hr")
            breakElement.id = "!break"
            var lastElement = generateCard(0, alarmCause)
            document.body.insertBefore(breakElement, document.body.childNodes[2])
            document.body.insertBefore(lastElement, document.body.childNodes[2])
                //'<li> <h1> <a style="color:lime" href="#" tabindex="1" class="option" id="alarm">Click to end alarm</a></h1></li> '
        }
        if (tutorial) {
            document.getElementById("!tutorial3").style.display = "inline"
        } else {
            document.getElementById("!tutorial3").style.display = "none"
        }
    } else if ((!alarmOn) && document.getElementById("!last") && document.getElementById("!break")) {
        document.body.removeChild(document.getElementById("!last"))
        document.body.removeChild(document.getElementById("!break"))
        document.getElementById("!tutorial3").style.display = "none"
    }
    for (var key in onlineStreamers) {
        var isLast = false
        if (document.getElementById("!last")) {
            var last = document.getElementById("!last")
            if (last.childNodes[0].id == (onlineStreamers[key] + "!")) {
                isLast = true
            }
        }
        if (!isLast) {
            var onlineElement = generateCard(1, onlineStreamers[key])
            document.getElementById("!online").appendChild(onlineElement)
        }
        //<li> <a href="#" tabindex="1" class="option" id="' + onlineStreamers[key] + '"> <span style="color:blue">  <b>' + onlineStreamers[key] + ": </b> </span> Playing " + onlineGames[key] + '</a></li> '
    }
    for (var key in offlineStreamers) {
        if (offlineStreamers[key] != "") {
            if (!offlineHide) {
                var offlineElement = generateCard(2, offlineStreamers[key])
                document.getElementById("!offline").appendChild(offlineElement)
                    //'<li> <a style="color:red" href="#" tabindex="1" class="option" id="' + offlineStreamers[key] + '">' + offlineStreamers[key] + '</a></li> '
            }
        }
    }

    performSearch()

    if ((!(onlineStreamers.length > 0) || (onlineStreamers[0] == "")) && (!(offlineStreamers.length > 0) || (offlineStreamers[0] == "")) && tutorial) {
        document.getElementById("!tutorial2").style.display = "inline"
    } else {
        document.getElementById("!tutorial2").style.display = "none"
    }

    if ((!(onlineStreamers.length > 0) || (onlineStreamers[0] == "")) && (!(offlineStreamers.length > 0) || (offlineStreamers[0] == ""))) {
        document.getElementById("!searchform").style.display = "none"
    } else {
        document.getElementById("!searchform").style.display = "inline"
    }

    var lastbtn = document.getElementById("!last")
    if (lastbtn) {
        lastbtn.onclick = function() {
            addon.port.emit("endAlarm", "End the alarm!")
        }
        lastbtn.oncontextmenu = function() {
            addon.port.emit("endAlarm", "End the alarm!")
        }
    }
    for (var key in followedStreamers) {
        if (document.getElementById(followedStreamers[key] + "!")) {
            onClick(document.getElementById(followedStreamers[key] + "!"))
            if (containsValue(onlineStreamers, followedStreamers[key])) {
                onRightClick(document.getElementById(followedStreamers[key] + "!"))
            }
        }
    }
}

addon.port.on("updatePage", function(payload) {
    //console.log("Payload received")
    onlineStreamers = payload[0]
    onlineGames = payload[1]
    onlineTitles = payload[2]
    onlineViewers = payload[3]
    onlineAvatars = payload[4]
    onlineTimes = payload[5]
    offlineStreamers = payload[6]
    alarmOn = payload[7]
    followedStreamers = payload[8]
    defaultHidden = payload[9]
    offlineHide = payload[10]
    sortingMethod = payload[11]
    openTab = payload[12]
    useLive = payload[13]
    openChat = payload[14]
    previewWait = payload[15]
    tutorial = payload[16]
    alarmCause = payload[17]
    liveError = payload[18]
    errorCause = payload[19]
    hideShowHide = payload[20]
    local1 = payload[21]
    local2 = payload[22]
    updateList()
})