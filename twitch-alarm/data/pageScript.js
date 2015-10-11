//Imported variables
onlineStreamers = null
onlineGames = null
onlineTitles = null
onlineViewers = null
onlineAvatars = null
onlineTimes = null
offlineStreamers = null
alarmOn = null
hideAvatar = null
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
hidePreview = null
local1 = null
local2 = null
local3 = null
darkMode = null

searchedChannel = null
searchTarget = ""

//Unique variables

searchTerm = ""
searchOn = 0
searchOff = 0

rotatedegs = 0
searching_interval = null
import_interval = null
searchingTwitch = false
extraInfo = []

function cleanse(str) {
    var curvalue = str
    if (typeof(curvalue) == "string") {
        curvalue = curvalue.replace(/ /g, "")
        curvalue = curvalue.toLowerCase()
    }

    return curvalue
}

function onClick(obj) {
    obj.onclick = function() {
        var actname = (obj.id.substring(0, obj.id.length - 1))
        var lowerOnline = cleanse(onlineStreamers.join(",")).split(",")
        if (containsValue(lowerOnline, actname)) {
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

function onClick2(obj) {
    obj.onclick = function() {
        if (searchedChannel != null) {
            var actname = (obj.id.substring(0, obj.id.length - 1))
            if (searchedChannel[0].length > 0) {
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
        } else if (searchingTwitch && (searchTarget != "")) {
            var actname = (obj.id.substring(0, obj.id.length - 1))
            addon.port.emit("openTab", actname)
        }
    }
}

function openTab_(obj) {
    obj.onclick = function() {
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
    obj.onclick = function() {
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
    obj.onclick = function() {
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

function follow(obj, typ) {
    obj.onclick = function() {
        if (typ != 1) {
            var strname = obj.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.id
        } else {
            var strname = obj.parentNode.parentNode.parentNode.id
        }
        addon.port.emit("follow", strname)
        if (searchedChannel != null) {
            searchTarget = ""
            document.getElementById("!followsearch").value = ""
            searchTerm = ""
            performSearch()
            searchedChannel = null
            updateList()
        } else if (searchingTwitch) {
            searchTarget = ""
            document.getElementById("!followsearch").value = ""
            searchTerm = ""
            performSearch()
            searchedChannel = null
            updateList()
            searchTwitch(null)
        }
    }
}

function unfollow(obj, typ) {
    obj.onclick = function() {
        if (typ != 1) {
            var strname = obj.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.id
        } else {
            var strname = obj.parentNode.parentNode.parentNode.id
        }
        addon.port.emit("unfollow", strname)
        if (containsValue(extraInfo, strname)) {
            var namekey = extraInfo.indexOf(strname)
            extraInfo.splice(namekey, 1)
            updateList()
        }
        if (searchedChannel != null) {
            searchTarget = ""
            document.getElementById("!followsearch").value = ""
            searchTerm = ""
            performSearch()
            searchedChannel = null
            updateList()
        } else if (searchingTwitch) {
            searchTarget = ""
            searchTarget = ""
            document.getElementById("!followsearch").value = ""
            searchTerm = ""
            performSearch()
            searchedChannel = null
            updateList()
            searchTwitch(null)
        }
    }
}

function importt(obj, typ) {
    obj.onclick = function() {
        if (typ != 1) {
            var strname = obj.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.id
        } else {
            var strname = obj.parentNode.parentNode.parentNode.id
        }
        addon.port.emit("importUser", strname)
        import_interval = setInterval(rotateRefresh, 30)
        if (containsValue(extraInfo, strname)) {
            var namekey = extraInfo.indexOf(strname)
            extraInfo.splice(namekey, 1)
            updateList()
        }
        if (searchedChannel != null) {
            searchTarget = ""
            document.getElementById("!followsearch").value = ""
            searchTerm = ""
            performSearch()
            searchedChannel = null
            updateList()
        } else if (searchingTwitch) {
            searchTarget = ""
            document.getElementById("!followsearch").value = ""
            searchTerm = ""
            performSearch()
            searchedChannel = null
            updateList()
            searchTwitch(null)
        }
    }
}

function rotateRefresh() {
    document.getElementById("!forcerefresh").style.transform = "rotate(" + rotatedegs + "deg)"
    rotatedegs = rotatedegs + 10
}

function onRightClick(obj) {
    obj.oncontextmenu = function() {
        if (searchedChannel == null) {
            var actname = (obj.id.substring(0, obj.id.length - 1))
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
}

function onRightClick2(obj) {
    obj.oncontextmenu = function() {
        searchTarget = ""
        document.getElementById("!followsearch").value = ""
        searchTerm = ""
        performSearch()
        searchedChannel = null
        if (searchingTwitch) {
            searchTwitch(null)
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

document.getElementById("!searchtwitch").onclick = function() {
    searchTwitch(searchTerm)
}

document.getElementById("!followsearch").onkeydown = function(e) {
    if (e.keyCode == 13) {
        searchTwitch(searchTerm)
    }
}

function performSearch() {
    searchOff = 0
    searchOn = 0
    if (searchTerm != "") {
        document.getElementById("!tutorial2").style.display = "none"
    } else if ((!(onlineStreamers.length > 0) || (onlineStreamers[0] == "")) && (!(offlineStreamers.length > 0) || (offlineStreamers[0] == "")) && tutorial) {
        document.getElementById("!tutorial2").style.display = "inline"
    }
    for (var key in offlineStreamers) {
        if (document.getElementById(offlineStreamers[key])) {
            if (offlineStreamers[key].search(searchTerm) != -1) {
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
        if (document.getElementById(cleanse(onlineStreamers[key]))) {
            if (((onlineStreamers[key].toLowerCase()).search(searchTerm) != -1) || (onlineGames[key].toLowerCase().search(searchTerm) != -1) || (onlineTitles[key].toLowerCase().search(searchTerm) != -1)) {
                var elem = document.getElementById(cleanse(onlineStreamers[key]))
                elem.style.display = "inline"
                searchOn += 1
            } else {
                var elem = document.getElementById(cleanse(onlineStreamers[key]))
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
    /*
        /if (searchOn == onlineStreamers.length) {
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
        */

}

document.getElementById("!followsearch").oninput = function() {
    if (searchingTwitch) {
        searchTwitch(null)
        updateList()
    }
    if (searchedChannel) {
        searchTarget = ""
        searchedChannel = null
        updateList()
    }
    searchTerm = document.getElementById("!followsearch").value.toLowerCase()
    performSearch()
}

document.getElementById("!forcerefresh").onclick = function() {
    addon.port.emit("forceRefresh")
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
    if (num != null) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, local2);
    } else {
        /*
          console.log(onlineStreamers)
          console.log(onlineGames)
          console.log(onlineTitles)
          console.log(onlineAvatars)
          console.log(onlineTimes)
          console.log(onlineViewers)
          */
    }
}

function generateCard(status, name) {
    //Status: 0 = searched channel, 1 = normal online channel, 2 = offline channel, 3 = target of search (search hasn't completed yet)
    if (searchedChannel && (status != 0)) {
        if (cleanse(searchedChannel[1][0]) == name) {
            return null
        }
    }
    if (searchingTwitch && (status != 3)) {
        if (searchTarget == cleanse(name)) {
            return null
        }
    }
    if ((status == 2) || (status == 3)) {
        var mainLi = document.createElement("li")
        mainLi.id = name
        var mainTable = document.createElement("table")
        var trof = document.createElement("tr")
        mainTable.style.width = "100%"
        var tdof1 = document.createElement("td")
        trof.appendChild(tdof1)
        if ((containsValue(extraInfo, name)) || (status == 3)) {
            var tdof2 = document.createElement("td")
            var tdof3 = document.createElement("td")

            tdof2.style.width = "24px"
            tdof2.style.rowSpan = "10"
            tdof2.style.height = "100%"

            if (!containsValue(followedStreamers, name)) {
                tdof2.className = "follow"
                follow(tdof2, 1)
            } else {
                tdof2.className = "unfollow"
                unfollow(tdof2, 1)
            }

            tdof3.style.width = "24px"
            tdof3.style.rowSpan = "10"
            tdof3.style.height = "100%"
            tdof3.className = "import"
            importt(tdof3, 1)

            trof.appendChild(tdof2)
            trof.appendChild(tdof3)
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
        return mainLi
    } else {
        var namekey = null
        var game = null
        var title = null
        var viewers = null
        var avatar = null
        var time = null
        var game = null
        var followers = null
        var views = null
        if (status == 1) {
            namekey = onlineStreamers.indexOf(name)
            game = onlineGames[namekey]
            title = onlineTitles[namekey]
            viewers = onlineViewers[namekey]
            avatar = onlineAvatars[namekey]
            time = onlineTimes[namekey]
        } else {
            if (searchedChannel[0].length > 0) {
                viewers = searchedChannel[0][0]
                time = searchedChannel[0][1]
            }
            avatar = searchedChannel[1][1]
            title = searchedChannel[1][2]
            game = searchedChannel[1][3]
            views = searchedChannel[1][4]
            followers = searchedChannel[1][5]
        }
        if (avatar == "!null!") {
            avatar = "http://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_150x150.png"
        }
        var mainLi = document.createElement("li")
        mainLi.style.margin = "0px"
        mainLi.id = cleanse(name)
        var mainTable = document.createElement("table")
        mainTable.style.width = "100%"
        mainTable.border = "0"
        mainTable.cellpadding = "4"
        mainTable.cellspacing = "0"

        var tr0 = document.createElement("tr")
        var td05 = document.createElement("td")
        tr0.appendChild(td05)

        var btns_ = false
        if ((status == 0) || (containsValue(extraInfo, cleanse(name)))) {
            if (status == 0) {
                if (searchedChannel[0].length > 0) {
                    btns_ = true
                }
            } else {
                btns_ = true
            }
        }
        if (btns_) {
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
        if ((status == 0) || (containsValue(extraInfo, cleanse(name)))) {
            var extbl = document.createElement("table")
            extbl.style.width = "100%"
            extbl.style.height = "100%"
            var extd = document.createElement("td")
            extd.style.height = "100%"
            extd.style.width = "30px"
            extd.appendChild(extbl)
            var extr0 = document.createElement("tr")
            extr0.style.height = "50%"
            extr0.style.width = "100%"
            extbl.appendChild(extr0)
            var extr1 = document.createElement("tr")
            extr1.style.height = "50%"
            extr1.style.width = "100%"
            extbl.appendChild(extr1)
            var td0 = document.createElement("td")
            td0.style.width = "100%"
            if (!containsValue(followedStreamers, cleanse(name))) {
                td0.className = "follow"
                follow(td0)
            } else {
                td0.className = "unfollow"
                unfollow(td0)
            }
            extr0.appendChild(td0)
            var td01 = document.createElement("td")
            td01.style.width = "100%"
            td01.className = "import"
            importt(td01)
            extr1.appendChild(td01)
            tr0.appendChild(extd)
        }
        var tr1 = document.createElement("tr")
        var mainTbody = document.createElement("table")
        mainTbody.className = "option"
        mainTbody.id = cleanse(name) + "!"
        mainTbody.style.width = "100%"
        mainTbody.border = "0"
        mainTbody.style.borderSpacing = "0px"
            //Row 1
        if (!hideAvatar) {
            var td1a = document.createElement("td")
            td1a.style.width = "78px"
            td1a.rowSpan = "10"
            var img1 = document.createElement("img")
            img1.height = "78"
            img1.src = avatar
            img1.width = "78"
            img1.align = "left"
            td1a.appendChild(img1)
            tr1.appendChild(td1a)
        }
        var td1b = document.createElement("td")
        var img2 = document.createElement("img")
        img2.src = "streamer.png"
        img2.style.verticalAlign = "bottom"
        var span1 = document.createElement("span")
        if (status == 1) {
            span1.className = "online"
        } else {
            if (searchedChannel[0].length > 0) {
                span1.className = "online"
            } else {
                span1.className = "offline"
            }
        }

        var bold1 = document.createElement("strong")
        bold1.textContent = " " + name + " "
        span1.appendChild(bold1)
        td1b.appendChild(img2)
        td1b.appendChild(span1)
        viewers_ = false
        if (status == 1) {
            viewers_ = true
        } else {
            if (searchedChannel[0].length > 0) {
                viewers_ = true
            }
        }
        if (viewers_) {
            var img6 = document.createElement("img")
            img6.src = "viewers.png"
            img6.style.verticalAlign = "bottom"
            var span3 = document.createElement("span")
            span3.textContent = insSeparators(viewers)
            td1b.appendChild(img6)
            td1b.appendChild(span3)
        }
        tr1.appendChild(td1b)
        var preview_ = false
        if (!hidePreview) {
            if (status == 0) {
                if (searchedChannel[0].length > 0) {
                    preview_ = true
                }
            } else {
                preview_ = true
            }
        }
        if (preview_) {
            var td1c = document.createElement("td")
            td1c.rowSpan = "10"
            var img3 = document.createElement("img")
            img3.height = "78"
            var unix = new Date().getTime()
            unix = Math.ceil(unix / 1000)
            unix = Math.ceil(unix / previewWait)
            img3.src = "http://static-cdn.jtvnw.net/previews-ttv/live_user_" + cleanse(name) + "-139x78.jpg?" + String(unix)
            img3.width = "139"
            img3.align = "right"
            td1c.appendChild(img3)
            tr1.appendChild(td1c)
        }
        //Row 2
        var tr2 = document.createElement("tr")
        var td2 = document.createElement("td")
        var img4 = document.createElement("img")
        img4.src = "channel.png"
        img4.style.verticalAlign = "bottom"
        td2.appendChild(img4)
        var span2 = document.createElement("span")
        if ((cleanse(name) == errorCause) && liveError) {
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
        mainTbody.appendChild(tr2)
            //Row 3
        var tr3 = document.createElement("tr")
        var td3 = document.createElement("td")
        var img5 = document.createElement("img")
        img5.src = "game.png"
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
        if (status == 0) {
            if (views != null) {
                var tr4 = document.createElement("tr")
                var td4 = document.createElement("td")
                var img45 = document.createElement("img")
                img45.src = "views.png"
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
                var img475 = document.createElement("img")
                img475.src = "followers.png"
                img475.style.verticalAlign = "bottom"
                td45.appendChild(img475)
                var span475 = document.createElement("span")
                span475.textContent = " " + insSeparators(followers)
                td45.appendChild(span475)
                tr45.appendChild(td45)
                mainTbody.appendChild(tr45)
            }
        }
        //Row 5
        var time_ = false
        if (status == 1) {
            time_ = true
        } else {
            if (searchedChannel[0].length > 0) {
                time_ = true
            }
        }
        if (time_) {
            var tr5 = document.createElement("tr")
            var td5 = document.createElement("td")
            var img7 = document.createElement("img")
            img7.src = "time.png"
            img7.style.verticalAlign = "bottom"
            td5.appendChild(img7)
            var span4 = document.createElement("span")
            var bold3 = document.createElement("strong")
            var span5 = document.createElement("span")
            span4.textContent = " " + local1[0] + " "
            bold3.textContent = genTime(time)
            span5.textContent = " " + local1[1]
            td5.appendChild(span4)
            td5.appendChild(bold3)
            td5.appendChild(span5)
            tr5.appendChild(td5)
            mainTbody.appendChild(tr5)
        }
        mainTbody.insertBefore(tr1, mainTbody.childNodes[0])
        td05.appendChild(mainTbody)
        mainTable.appendChild(tr0)
            //End
        mainLi.appendChild(mainTable)
        return mainLi
    }
}

function updateList() {
    if (alarmOn) {
        searchTarget = ""
        document.getElementById("!followsearch").value = ""
        searchTerm = ""
        performSearch()
        searchedChannel = null
        addon.port.emit("endAlarm", "End the alarm!")
    }
    document.getElementById("!followsearch").placeholder = local3
    if (darkMode) {
        document.getElementById("!csslink").href = "dark.css"
    } else {
        document.getElementById("!csslink").href = "light.css"
    }
    var alarmbtn = null
    var headers = [document.getElementById("!searched"), document.getElementById("!online"), document.getElementById("!offline")]
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
    if ((searchedChannel != null) && (!searchingTwitch)) {
        document.getElementById("!searchedspan").style.display = "inline"
        var searchedElement = generateCard(0, searchedChannel[1][0])
        document.getElementById("!searched").appendChild(searchedElement)
        onClick2(document.getElementById(searchedElement.id + "!"))
        onRightClick2(document.getElementById(searchedElement.id + "!"))
    } else {
        if (!searchingTwitch) {
            document.getElementById("!searchedspan").style.display = "none"
        }
    }
    if (searchingTwitch && (searchTarget != "")) {
        document.getElementById("!searchedspan").style.display = "inline"
        var searchedElement = generateCard(3, searchTarget)
        if (searchedElement != null) {
            document.getElementById("!searched").appendChild(searchedElement)
            onClick2(document.getElementById(searchedElement.id + "!"))
            onRightClick2(document.getElementById(searchedElement.id + "!"))
        }
    } else {
        if (searchedChannel == null) {
            document.getElementById("!searchedspan").style.display = "none"
        }
    }
    for (var key in onlineStreamers) {
        if (containsValue(followedStreamers, cleanse(onlineStreamers[key]))) {
            var onlineElement = generateCard(1, onlineStreamers[key])
            if (onlineElement != null) {
                document.getElementById("!online").appendChild(onlineElement)
            }
        }
        //<li> <a href="#" tabindex="1" class="option" id="' + onlineStreamers[key] + '"> <span style="color:blue">  <b>' + onlineStreamers[key] + ": </b> </span> Playing " + onlineGames[key] + '</a></li> '
    }
    for (var key in offlineStreamers) {
        if (offlineStreamers[key] != "") {
            if (!offlineHide) {
                if (containsValue(followedStreamers, offlineStreamers[key])) {
                    var offlineElement = generateCard(2, offlineStreamers[key])
                    if (offlineElement != null) {
                        document.getElementById("!offline").appendChild(offlineElement)
                    }
                }
                //'<li> <a style="color:red" href="#" tabindex="1" class="option" id="' + offlineStreamers[key] + '">' + offlineStreamers[key] + '</a></li> '
            }
        }
    }
    performSearch()
    if ((!(onlineStreamers.length > 0) || (onlineStreamers[0] == "")) && (!(offlineStreamers.length > 0) || (offlineStreamers[0] == "")) && tutorial && (searchTerm == "")) {
        document.getElementById("!tutorial2").style.display = "inline"
    } else {
        document.getElementById("!tutorial2").style.display = "none"
    }
    for (var key in followedStreamers) {
        if (document.getElementById(followedStreamers[key] + "!")) {
            onClick(document.getElementById(followedStreamers[key] + "!"))
            onRightClick(document.getElementById(followedStreamers[key] + "!"))
        }
    }
}

function searchTwitch(term) {
    var search2 = term
    searchTarget = ""
    searchedChannel = null
    if (search2 != null) {
        search2 = cleanse(search2)
        search2 = search2.replace(/\W/g, '')
        searchTarget = search2
    }
    if (!searchingTwitch) {
        searching_interval = setInterval(rotateRefresh, 30)
    }
    searchingTwitch = true
    updateList()
    addon.port.emit("searchTwitch", search2)
}

addon.port.on("importComplete", function() {
    clearInterval(import_interval)
    rotatedegs = 0
    document.getElementById("!forcerefresh").style.transform = "rotate(0deg)"
})

addon.port.on("searchedChannel", function(payload) {
    searchingTwitch = false
    searchTarget = ""
    clearInterval(searching_interval)
    rotatedegs = 0
    document.getElementById("!forcerefresh").style.transform = "rotate(0deg)"
    var search2 = searchTerm
    search2 = cleanse(search2)
    search2 = search2.replace(/\W/g, '')
    if (payload != null) {
        if (search2 == cleanse(payload[1][0])) {
            searchedChannel = payload
            updateList()
        } else {
            searchTarget = ""
            searchedChannel = null
            updateList()
        }
    } else {
        searchTarget = ""
        searchedChannel = null
        updateList()
    }

})

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
    hideAvatar = payload[9]
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
    hidePreview = payload[20]
    local1 = payload[21]
    local2 = payload[22]
    local3 = payload[23]
    darkMode = payload[24]
    updateList()
})