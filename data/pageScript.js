onlineStreamers = []
onlineGames = []
onlineTitles = []
onlineViewers = []
onlineAvatars = []
offlineStreamers = []
hiddenStreamers = []
alarmOn = false
defaultHidden = false
offlineHide = false
sortingMethod = "L"
followedStreamers = []

function onClick(obj) {
    obj.onclick = function() {
        addon.port.emit("openTab", (obj.id.substring(0, obj.id.length - 1)))
    }
}

function onRightClick(obj) {
    var objname = obj.id.substring(0, obj.id.length - 1)
    if (obj.parentNode.id == "!last") {
        return;
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
        if (status == 0) {
            mainLi.id = "!last"
        }
        var mainA = document.createElement("a")
        mainA.className = "option"
        mainA.id = name + "!"
        var mainTable = document.createElement("table")
        if ((status == 1) && (namekey != onlineStreamers.length - 1)) {
            mainTable.style.borderBottom = "1px solid"
        }
        mainTable.style.width = "100%"
        mainTable.border = "0"
        mainTable.cellpadding = "4"
        mainTable.cellspacing = "0"
        var mainTbody = document.createElement("tbody")
        var tr1 = document.createElement("tr")
        var td1a = document.createElement("td")
        td1a.rowSpan = "4"
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
        var span1 = document.createElement("span")
        span1.style.color = "DodgerBlue"
        var bold1 = document.createElement("strong")
        bold1.textContent = " " + name
        span1.appendChild(bold1)
        td1b.appendChild(img2)
        td1b.appendChild(span1)
        tr1.appendChild(td1b)
        var td1c = document.createElement("td")
        td1c.rowSpan = "4"
        var img3 = document.createElement("img")
        img3.alt = ""
        img3.height = "90"
        img3.src = "http://static-cdn.jtvnw.net/previews-ttv/live_user_" + name + "-320x180.jpg"
        img3.width = "160"
        img3.align = "right"
        td1c.appendChild(img3)
        tr1.appendChild(td1c)
        var tr2 = document.createElement("tr")
        var td2 = document.createElement("td")
        var img4 = document.createElement("img")
        img4.alt = ""
        img4.src = "channel.png"
        td2.appendChild(img4)
        var span2 = document.createElement("span")
        if (title != "") {
            span2.textContent = ' "' + title + '"'
            td2.appendChild(span2)
        } else {
            var ital1 = document.createElement("i")
            span2.textContent = " None"
            ital1.appendChild(span2)
            td2.appendChild(ital1)
        }
        tr2.appendChild(td2)
        var tr3 = document.createElement("tr")
        var td3 = document.createElement("td")
        var img5 = document.createElement("img")
        img5.alt = ""
        img5.src = "game.png"
        td3.appendChild(img5)
        var bold2 = document.createElement("strong")
        if (game != null) {
            bold2.textContent = " " + game
            td3.appendChild(bold2)
        } else {
            var ital2 = document.createElement("i")
            bold2.textContent = " None"
            ital2.appendChild(bold2)
            td3.appendChild(ital2)
        }
        tr3.appendChild(td3)
        var tr4 = document.createElement("tr")
        var td4 = document.createElement("td")
        var img6 = document.createElement("img")
        img6.alt = ""
        img6.src = "viewers.png"
        td4.appendChild(img6)
        var span3 = document.createElement("span")
        span3.textContent = " " + viewers.toString()
        td4.appendChild(span3)
        tr4.appendChild(td4)
        mainTbody.appendChild(tr2)
        mainTbody.appendChild(tr3)
        mainTbody.appendChild(tr4)
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
    var most_recent = onlineStreamers[0]

    if (sortingMethod == "V") {
        var newNames = []
        var newGames = []
        var newTitles = []
        var newAvatars = []
        for (var key in newViewers) {
            newViewers[key] = Number(newViewers[key])
        }
        var newViewers = onlineViewers.concat().sort(function(a, b) {
            return b - a
        });
        var newViewers2 = newViewers
        var leng = newViewers.length
        for (i = 0; i < leng; i++) {
            var namekey = onlineViewers.indexOf(newViewers[i])
            newNames.push(onlineStreamers[namekey])
            newGames.push(onlineGames[namekey])
            newTitles.push(onlineTitles[namekey])
            newAvatars.push(onlineAvatars[namekey])
            onlineViewers[namekey] = "none"
        }
        onlineStreamers = newNames
        onlineGames = newGames
        onlineAvatars = newAvatars
        onlineTitles = newTitles
        onlineViewers = newViewers2
    }
    if (offlineHide) {
        document.getElementById("online!").style.display = "none"
        document.getElementById("offline!").style.display = "none"
    } else {
        document.getElementById("online!").style.display = "inline"
        document.getElementById("offline!").style.display = "inline"
    }
    for (var key in headers) {
        while (headers[key].firstChild) {
            headers[key].removeChild(headers[key].firstChild);
        }
    }
    for (var key in hiddenStreamers) {
        if (!containsValue(onlineStreamers, hiddenStreamers[key])) {
            hiddenStreamers.splice(key, 1)
        }
    }
    if (alarmOn) {
        if (!document.getElementById("!alarm")) {
            var alarmElement = document.createElement("li");
            var alarmhead = document.createElement("h1")
            var alarmA = document.createElement("a")
            alarmElement.id = "!alarm"
            alarmA.id = "!alarm!"
            alarmA.textContent = (most_recent + " has come online! Click here or below to end the alarm.")
            alarmA.setAttribute("class", "option")
            alarmA.style.color = "lime"
            alarmhead.appendChild(alarmA)
            alarmElement.appendChild(alarmhead)
            var breakElement = document.createElement("hr")
            breakElement.id = "!break"
            var lastElement = generateCard(0, most_recent)
            document.body.insertBefore(breakElement, document.body.childNodes[0])
            document.body.insertBefore(lastElement, document.body.childNodes[0])
            document.body.insertBefore(alarmElement, document.body.childNodes[0])
                //'<li> <h1> <a style="color:lime" href="#" tabindex="1" class="option" id="alarm">Click to end alarm</a></h1></li> '
        }

    } else if (!(alarmOn) && document.getElementById("!alarm") && document.getElementById("!last") && document.getElementById("!break")) {
        document.body.removeChild(document.getElementById("!alarm"))
        document.body.removeChild(document.getElementById("!last"))
        document.body.removeChild(document.getElementById("!break"))
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
    var alarmbtn = document.getElementById("!alarm!")
    var lastbtn = document.getElementById("!last")
    if (alarmbtn && lastbtn) {
        alarmbtn.onclick = function() {
            addon.port.emit("endAlarm", "End the alarm!");
        };
        lastbtn.onclick = function() {
            addon.port.emit("endAlarm", "End the alarm!");
        };
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
    offlineStreamers = payload[5]
    alarmOn = payload[6]
    followedStreamers = payload[7]
    defaultHidden = payload[8]
    offlineHide = payload[9]
    sortingMethod = payload[10]
    updateList()
})

updateList()