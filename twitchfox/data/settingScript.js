settings = new Map()

//Follower variables
followedStreamers = null
followedGames = null
mutedChannels = []
authorized = false

//Alarm variables

settings.set("updateInterval", null)
settings.set("alertOn", null)
settings.set("alertChange", null)
settings.set("alertOff", null)
settings.set("alertGames", null)
settings.set("desktopNotifs", null)
settings.set("soundAlarm", null)
settings.set("alarmVolume", null)
settings.set("soundInterval", null)
settings.set("restrictAlarm", null)
settings.set("restrictFrom", null)
settings.set("restrictTo", null)
settings.set("customAlarm", null)
settings.set("alarmLimit", null)
settings.set("alarmLength", null)
settings.set("uniqueIds", null)
streamIds = null

//Interface variables

settings.set("liveQuality", null)
settings.set("livePath", null)
settings.set("hideAvatar", null)
settings.set("hideOffline", null)
settings.set("sortMethod", null)
settings.set("openTab", null)
settings.set("openLive", null)
settings.set("openPopout", null)
settings.set("previewWait", null)
settings.set("tutorialOn", null)
settings.set("hidePreview", null)
settings.set("darkMode", null)
settings.set("searchLim", null)

//Other variables

curVersion = null

//Settings variables

searchTerm = ""
searchNum = 0

//HTML elements

followClear = document.getElementById("followdefault")
followAdd = document.getElementById("followinput")
followSubmit = document.getElementById("followsubmit")
followP1 = document.getElementById("followedp1")
followP2 = document.getElementById("followedp2")
followP3 = document.getElementById("followedp3")
followSearch = document.getElementById("followsearch")
followList = document.getElementById("followlist")
followRemove = document.getElementById("removeselected")
followMute = document.getElementById("muteall")
followUnmute = document.getElementById("unmuteall")
followImporter = document.getElementById("importinput")
followImport = document.getElementById("importsubmit")
followIfile = document.getElementById("importfile")
followEfile = document.getElementById("exportfile")

alarmDefault = document.getElementById("alarmdefault")
alarmWait = document.getElementById("updatelen")
alarmNotifs = document.getElementById("desktopnotifs")
alarmSound = document.getElementById("soundalarm")
alarmVol = document.getElementById("alarmvolume")
alarmSspan = document.getElementById("soundspan")
alarmInterval = document.getElementById("alarminterval")
alarmRestrict = document.getElementById("restrictalarm")
alarmRspan = document.getElementById("restrictspan")
alarmFrom = document.getElementById("restrictfrom")
alarmTo = document.getElementById("restrictto")
alarmCustom = document.getElementById("customalarm")
alarmOn = document.getElementById("alerton")
alarmChange = document.getElementById("alertchange")
alarmOff = document.getElementById("alertoff")
alarmGames = document.getElementById("gamealert")

alarmMax = document.getElementById("maxalarm")
alarmLim = document.getElementById("alarmlimit")
alarmLen = document.getElementById("alarmlen")
alarmId = document.getElementById("uniqueids")

interDefault = document.getElementById("interfacedefault")
interTutorial = document.getElementById("tutorial")
interHidepreview = document.getElementById("hidepreview")
interRadio = document.getElementById("sortradio")
interRecent = document.getElementById("sortrecent")
interViewers = document.getElementById("sortviewers")
interAlpha = document.getElementById("sortalpha")
interPreview = document.getElementById("previewwait")
interHideoff = document.getElementById("hideoff")
interHideavatar = document.getElementById("hideavatar")
interTab = document.getElementById("opentab")
interLive = document.getElementById("livestreamer")
interChat = document.getElementById("popout")
interQual = document.getElementById("livequality")
interPath = document.getElementById("livepath")
interDark = document.getElementById("darkmode")
interLim = document.getElementById("searchlim")

versionSpan = document.getElementById("versionspan")

function containsValue(list, obj) {
    if ((list.indexOf(obj)) > -1) {
        return true
    } else {
        return false
    }
}

function getSelectValues(select) {
    var result = []
    var options = select && select.options
    var opt
    for (var i = 0, iLen = options.length; i < iLen; i++) {
        opt = options[i]
        if (opt.selected) {
            result.push(opt.value || opt.text)
        }
    }
    return result
}

//Tabs

var tabLinks = new Array()
var contentDivs = new Array()

function init() {
    var tabListItems = document.getElementById('tabs').childNodes
    for (var i = 0; i < tabListItems.length; i++) {
        if (tabListItems[i].nodeName == "LI") {
            var tabLink = getFirstChildWithTagName(tabListItems[i], 'A')
            var id = getHash(tabLink.getAttribute('href'))
            tabLinks[id] = tabLink
            contentDivs[id] = document.getElementById(id)
        }
    }
    var i = 0
    for (var id in tabLinks) {
        tabLinks[id].onclick = showTab
        tabLinks[id].onfocus = function () {
            this.blur()
        }
        if (i == 0) tabLinks[id].className = 'selected'
        i++
    }
    var i = 0
    for (var id in contentDivs) {
        if (i != 0) contentDivs[id].className = 'tabContent hide'
        i++
    }
}

function showTab() {
    var selectedId = getHash(this.getAttribute('href'))
    for (var id in contentDivs) {
        if (id == selectedId) {
            tabLinks[id].className = 'selected'
            contentDivs[id].className = 'tabContent'
        } else {
            tabLinks[id].className = ''
            contentDivs[id].className = 'tabContent hide'
        }
    }
    // Stop the browser following the link
    return false
}

function getFirstChildWithTagName(element, tagName) {
    for (var i = 0; i < element.childNodes.length; i++) {
        if (element.childNodes[i].nodeName == tagName) return element.childNodes[i]
    }
}

function getHash(url) {
    var hashPos = url.lastIndexOf('#')
    return url.substring(hashPos + 1)
}

//Follower settings

followClear.onclick = function () {
    addon.port.emit("clearAll")
    mutedChannels = []
    updateSettings()
}

followAdd.onkeydown = function (e) {
    if (e.keyCode == 13) {
        if (followAdd.value != "") {
            var curvalue = followAdd.value
            curvalue = curvalue.replace(/ /g, "")
            curvalue = curvalue.replace(/\W/g, '')
            curvalue = curvalue.toLowerCase()
            addon.port.emit("follow", curvalue)
        }
        followAdd.value = ""
    }
}

followSubmit.onclick = function () {
    if (followAdd.value != "") {
        var curvalue = followAdd.value
        curvalue = curvalue.replace(/ /g, "")
        curvalue = curvalue.replace(/\W/g, '')
        curvalue = curvalue.toLowerCase()
        addon.port.emit("follow", curvalue)
    }
    followAdd.value = ""
}

followSearch.oninput = function () {
    searchTerm = followSearch.value
    updateFollowed()
}

document.onkeydown = function (e) {
    if (e.keyCode == 46) {
        var selected = getSelectValues(followList)
        for (var key in selected) {
            addon.port.emit("unfollow", selected[key])
        }
    }
}

followRemove.onclick = function () {
    var selected = getSelectValues(followList)
    for (var key in selected) {
        addon.port.emit("unfollow", selected[key])
    }
}

followMute.onclick = function () {
    mutedChannels = followedStreamers.join(",").split(",")
    updateSettings()
    addon.port.emit("updateChans")
}

followUnmute.onclick = function () {
    mutedChannels = []
    updateSettings()
    addon.port.emit("updateChans")
}

followImporter.onkeydown = function (e) {
    if (e.keyCode == 13) {
        if ((followImporter.value != "") && !authorized) {
            addon.port.emit("importUser", followImporter.value)
        }
        followImporter.value = ""
    }
}

followImport.onclick = function () {
    if ((followImporter.value != "") && !authorized) {
        addon.port.emit("importUser", followImporter.value)
    }
    followImporter.value = ""
}

followIfile.onchange = function () {
    var file = this.files[0]
    var reader = new FileReader()
    var smode = false
    var gmode = true
    var importfollows = []
    var importmutes = []
    var importgames = []
    reader.onload = function (progressEvent) {
        var lines = this.result.split('\n')
        for (var key in lines) {
            if (lines[key] != "") {
                //Do stuff on current line
                var curvalue = lines[key]
                if (curvalue == "/S") {
                    smode = true
                } else if (curvalue == "S/") {
                    smode = false
                } else if (curvalue == "/G") {
                    gmode = true
                } else if (curvalue == "G/") {
                    gmode = false
                } else {
                    if (smode) {
                        var newkey = curvalue.split("|")[0]
                        var newval = curvalue.split("|")[1]
                        settings.set(newkey, JSON.parse(newval))
                    } else if (gmode) {
                        importgames.push(curvalue)
                    } else {
                        curvalue = curvalue.replace(/ /g, "")
                        curvalue = curvalue.replace(/\W/g, '')
                        curvalue = curvalue.toLowerCase()
                        importfollows.push(curvalue)
                        importmutes.push((curvalue.slice(0, 1) == "!") ? true : false)
                    }
                }
            }
        }
        addon.port.emit("importFromFile", [importfollows, importmutes, importgames])
    }
    reader.readAsText(file)
}

followEfile.onclick = function () {
    var textToWrite = createText()
    var textFileAsBlob = new Blob([textToWrite], {
        type: 'text/plain'
    })
    var fileNameToSaveAs = "TwitchFox_" + (new Date().toJSON().slice(0, 10)) + ".txt"
    var downloadLink = document.createElement("a")
    downloadLink.download = fileNameToSaveAs
    downloadLink.textContent = "Download File"
    downloadLink.href = window.URL.createObjectURL(textFileAsBlob)
    downloadLink.onclick = destroyClickedElement
    downloadLink.style.display = "none"
    document.body.appendChild(downloadLink)
    downloadLink.click()
}

//Alarm settings

alarmDefault.onclick = function () {
    //Default alarm settings

    settings.set("updateInterval", 60)
    settings.set("alertOn", true)
    settings.set("alertChange", false)
    settings.set("alertOff", false)
    settings.set("desktopNotifs", true)
    settings.set("soundAlarm", true)
    settings.set("alarmVolume", 100)
    settings.set("soundInterval", 1)
    settings.set("restrictAlarm", false)
    settings.set("restrictFrom", "22:00:00")
    settings.set("restrictTo", "06:00:00")
    settings.set("customAlarm", "")
    settings.set("alarmLimit", false)
    settings.set("alarmLength", 10)
    settings.set("uniqueIds", true)
    streamIds = []
    updateSettings()
}

alarmWait.onchange = function () {
    if (alarmWait.value < 60) {
        alarmWait.value = 60
    }
    settings.set("updateInterval", alarmWait.value)
    updateSettings()
}

alarmOn.onchange = function () {
    settings.set("alertOn", alarmOn.checked)
    updateSettings()
}

alarmChange.onchange = function () {
    settings.set("alertChange", alarmChange.checked)
    updateSettings()
}

alarmOff.onchange = function () {
    settings.set("alertOff", alarmOff.checked)
    updateSettings()
}

alarmGames.onchange = function () {
    settings.set("alertGames", alarmGames.checked)
    updateSettings()
}

alarmNotifs.onchange = function () {
    settings.set("desktopNotifs", alarmNotifs.checked)
    updateSettings()
}

alarmSound.onchange = function () {
    settings.set("soundAlarm", alarmSound.checked)
    updateSettings()
}

alarmVol.oninput = function () {
    settings.set("alarmVolume", alarmVol.value)
    updateSettings()
}

alarmInterval.onchange = function () {
    settings.set("soundInterval", alarmInterval.value)
    updateSettings()
}

alarmRestrict.onchange = function () {
    settings.set("restrictAlarm", alarmRestrict.checked)
    updateSettings()
}

alarmFrom.onchange = function () {
    var dat = (alarmFrom.value).replace(/\D/g, '')
    var dat2 = (alarmFrom.value).replace(/\d/g, '')
    if ((dat == "") || (dat2 != "::") || ((alarmFrom.value).length < 8)) {
        alarmFrom.value = settings.get("restrictFrom")
    } else {
        dat = Number(dat)
        if ((dat > 235959) || (dat < 0)) {
            alarmFrom.value = settings.get("restrictFrom")
        } else {
            settings.set("restrictFrom", alarmFrom.value)
            updateSettings()
        }
    }
}

alarmTo.onchange = function () {
    var dat = (alarmTo.value).replace(/\D/g, '')
    var dat2 = (alarmTo.value).replace(/\d/g, '')
    if ((dat == "") || (dat2 != "::") || ((alarmTo.value).length < 8)) {
        alarmTo.value = settings.get("restrictTo")
    } else {
        dat = Number(dat)
        if ((dat > 235959) || (dat < 0)) {
            alarmTo.value = settings.get("restrictTo")
        } else {
            settings.set("restrictTo", alarmTo.value)
            updateSettings()
        }
    }
}

alarmCustom.onchange = function () {
    settings.set("customAlarm", alarmCustom.value)
    updateSettings()
}

alarmLim.onchange = function () {
    settings.set("alarmLimit", alarmLim.checked)
    updateSettings()
}

alarmLen.onchange = function () {
    settings.set("alarmLength", alarmLen.value)
    updateSettings()
}

alarmId.onchange = function () {
    settings.set("uniqueIds", alarmId.checked)
    updateSettings()
}

//Interface settings

interDefault.onclick = function () {
    //Default interface settings

    settings.set("liveQuality", "best")
    settings.set("livePath", "")
    settings.set("hideAvatar", false)
    settings.set("hideOffline", false)
    settings.set("hidePreview", false)
    settings.set("darkMode", false)
    settings.set("sortMethod", "recent")
    settings.set("openTab", true)
    settings.set("openLive", false)
    settings.set("openPopout", false)
    settings.set("previewWait", 30)
    settings.set("tutorialOn", true)
    settings.set("searchLim", 20)
    updateSettings()
}

interTutorial.onchange = function () {
    settings.set("tutorialOn", interTutorial.checked)
    updateSettings()
}

interHidepreview.onchange = function () {
    settings.set("hidePreview", interHidepreview.checked)
    updateSettings()
}

interRecent.onclick = function () {
    if (interRecent.checked) {
        settings.set("sortMethod", "recent")
    } else if (interViewers.checked) {
        settings.set("sortMethod", "viewers")
    } else if (interAlpha.checked) {
        settings.set("sortMethod", "alpha")
    }
    updateSettings()
}

interViewers.onclick = function () {
    if (interRecent.checked) {
        settings.set("sortMethod", "recent")
    } else if (interViewers.checked) {
        settings.set("sortMethod", "viewers")
    } else if (interAlpha.checked) {
        settings.set("sortMethod", "alpha")
    }
    updateSettings()
}

interAlpha.onclick = function () {
    if (interRecent.checked) {
        settings.set("sortMethod", "recent")
    } else if (interViewers.checked) {
        settings.set("sortMethod", "viewers")
    } else if (interAlpha.checked) {
        settings.set("sortMethod", "alpha")
    }
    updateSettings()
}

interPreview.onchange = function () {
    settings.set("previewWait", interPreview.value)
    updateSettings()
}

interHideoff.onchange = function () {
    settings.set("hideOffline", interHideoff.checked)
    updateSettings()
}

interHideavatar.onchange = function () {
    settings.set("hideAvatar", interHideavatar.checked)
    updateSettings()
}

interTab.onchange = function () {
    settings.set("openTab", interTab.checked)
    updateSettings()
}

interLive.onchange = function () {
    settings.set("openLive", interLive.checked)
    updateSettings()
}

interChat.onchange = function () {
    settings.set("openPopout", interChat.checked)
    updateSettings()
}

interQual.onchange = function () {
    settings.set("liveQuality", interQual.value)
    updateSettings()
}

interPath.onchange = function () {
    settings.set("livePath", interPath.value)
    updateSettings()
}

interDark.onchange = function () {
    settings.set("darkMode", interDark.checked)
    updateSettings()
}

interLim.onchange = function () {
    if (interLim.value < 8) {
        interLim.value = 8
    }
    if (interLim.value > 100) {
        interLim.value = 100
    }
    settings.set("searchLim", Number(interLim.value))
    updateSettings()
}

//Rest of script

function onRightClick(obj) {
    if (obj != null) {
        obj.oncontextmenu = function () {
            var actname = obj.value
            if (!containsValue(mutedChannels, actname)) {
                mutedChannels.unshift(actname)
                obj.style.color = "#D44949"
            } else {
                var namekey = mutedChannels.indexOf(actname)
                mutedChannels.splice(namekey, 1)
                obj.style.color = "inherit"
            }
            var selected = getSelectValues(followList)
            for (var key in selected) {
                var newname = selected[key]
                var newobj = document.getElementById(newname + "!")
                if (!containsValue(mutedChannels, newname)) {
                    mutedChannels.unshift(newname)
                    newobj.style.color = "#D44949"
                } else {
                    var namekey = mutedChannels.indexOf(newname)
                    mutedChannels.splice(namekey, 1)
                    newobj.style.color = "inherit"
                }
            }
            addon.port.emit("updateChans")
            exportSettings()
        }
    }
}

function updateFollowed() {
    while (followList.firstChild) {
        followList.removeChild(followList.firstChild)
    }
    var searchcount = 0
    for (var key in followedStreamers) {
        if (followedStreamers[key].search(searchTerm) != -1) {
            searchcount += 1
            var newCard = document.createElement("option")
            newCard.value = followedStreamers[key]
            newCard.textContent = followedStreamers[key]
            newCard.id = followedStreamers[key] + "!"
            if (containsValue(mutedChannels, followedStreamers[key])) {
                newCard.style.color = "#D44949"
            }
            onRightClick(newCard)
            followList.appendChild(newCard)

        }
    }
    searchNum = searchcount

    if (followedStreamers.length > 0) {
        if ((followedStreamers[0] != "") && (searchNum == followedStreamers.length)) {
            followP1.textContent = " (" + followedStreamers.length + ")"
            followP2.style.display = "none"
            followP3.textContent = ":"
        } else if ((followedStreamers[0] != "") && (searchNum != followedStreamers.length)) {
            followP1.textContent = " (" + followedStreamers.length + " "
            followP2.style.display = "inline"
            followP3.textContent = " " + searchNum + "):"
        } else {
            followP1.textContent = ""
            followP2.style.display = "none"
            followP3.textContent = ":"
        }
    } else {
        followP1.textContent = ""
        followP2.style.display = "none"
        followP3.textContent = ":"
    }
}

function updateSettings() {
    updateFollowed()

    if (authorized) {
        document.getElementById("importspan").style.display = "none"
        document.getElementById("clearspan").style.display = "none"
        document.getElementById("beforeimport").style.display = "inherit"
    } else {
        document.getElementById("importspan").style.display = "inherit"
        document.getElementById("clearspan").style.display = "inherit"
        document.getElementById("beforeimport").style.display = "none"
    }

    alarmWait.value = settings.get("updateInterval")
    alarmGames.checked = settings.get("alertGames")
    alarmNotifs.checked = settings.get("desktopNotifs")
    alarmSound.checked = settings.get("soundAlarm")
    alarmVol.value = settings.get("alarmVolume")
    if (settings.get("soundAlarm")) {
        alarmSspan.style.display = "inline"
    } else {
        alarmSspan.style.display = "none"
    }
    alarmLim.checked = settings.get("alarmLimit")
    if (settings.get("alarmLimit")) {
        alarmMax.style.display = "inline"
    } else {
        alarmMax.style.display = "none"
    }
    alarmInterval.value = settings.get("soundInterval")

    alarmOn.checked = settings.get("alertOn")
    alarmChange.checked = settings.get("alertChange")
    alarmOff.value = settings.get("alertOff")

    alarmRestrict.checked = settings.get("restrictAlarm")
    if (settings.get("restrictAlarm")) {
        alarmRspan.style.display = "inline"
    } else {
        alarmRspan.style.display = "none"
    }
    alarmFrom.value = settings.get("restrictFrom")
    alarmTo.value = settings.get("restrictTo")
    alarmCustom.value = settings.get("customAlarm")

    alarmLen.value = settings.get("alarmLength")
    alarmId.checked = settings.get("uniqueIds")

    versionSpan.textContent = curVersion

    if (settings.get("sortMethod") == "recent") {
        interRecent.checked = true
        interViewers.checked = false
        interAlpha.checked = false
    } else if (settings.get("sortMethod") == "viewers") {
        interRecent.checked = false
        interViewers.checked = true
        interAlpha.checked = false
    } else if (settings.get("sortMethod") == "alpha") {
        interRecent.checked = false
        interViewers.checked = false
        interAlpha.checked = true
    }

    interTutorial.checked = settings.get("tutorialOn")

    if (interTutorial.checked && followedStreamers.length > 0) {
        document.getElementById("mutetut").style.display = "inherit"
    } else {
        document.getElementById("mutetut").style.display = "none"
    }

    interHidepreview.checked = settings.get("hidePreview")
    interHideoff.checked = settings.get("hideOffline")
    interHideavatar.checked = settings.get("hideAvatar")
    interTab.checked = settings.get("openTab")
    interLive.checked = settings.get("openLive")
    interPath.value = settings.get("livePath")
    interChat.checked = settings.get("openPopout")
    interPreview.value = settings.get("previewWait")
    interDark.checked = settings.get("darkMode")
    interLim.value = settings.get("searchLim")

    if (settings.get("darkMode")) {
        document.getElementById("!csslink").href = "darkset.css"
    } else {
        document.getElementById("!csslink").href = "lightset.css"
    }

    if (settings.get("liveQuality") == "best") {
        interQual.selectedIndex = 0
    } else if (settings.get("liveQuality") == "source") {
        interQual.selectedIndex = 1
    } else if (settings.get("liveQuality") == "high") {
        interQual.selectedIndex = 2
    } else if (settings.get("liveQuality") == "medium") {
        interQual.selectedIndex = 3
    } else if (settings.get("liveQuality") == "low") {
        interQual.selectedIndex = 4
    } else if (settings.get("liveQuality") == "mobile") {
        interQual.selectedIndex = 5
    } else if (settings.get("liveQuality") == "worst") {
        interQual.selectedIndex = 6
    } else if (settings.get("liveQuality") == "audio") {
        interQual.selectedIndex = 7
    }

    exportSettings()
}

function destroyClickedElement(event) {
    document.body.removeChild(event.target)
}

function createText() {
    var tex = "/S\n"
    settings.forEach(function (v, k) {
        if (typeof (v) == "string") {
            v.replace("|", "")
            tex = tex + k + "|" + '"' + v + '"\n'
        } else {
            tex = tex + k + "|" + v + '\n'
        }
    })
    var tex = tex + "S/\n/G\n"
    for (var key in followedGames) {
        tex = tex + followedGames[key] + "\n"
    }
    var tex = tex + "G/\n"
    for (var key in followedStreamers) {
        if (containsValue(mutedChannels, followedStreamers[key])) {
            tex = tex + "!"
        }
        tex = tex + followedStreamers[key] + "\n"
    }
    return tex
}

function exportSettings() {
    addon.port.emit("importSettings", [
        settings.get("updateInterval"),
        settings.get("soundAlarm"),
        settings.get("alarmLimit"),
        settings.get("alarmLength"),
        settings.get("uniqueIds"),
        streamIds,
        settings.get("darkMode"),
        settings.get("liveQuality"),
        settings.get("hideAvatar"),
        settings.get("hideOffline"),
        settings.get("sortMethod"),
        settings.get("openTab"),
        settings.get("openLive"),
        settings.get("openPopout"),
        settings.get("previewWait"),
        settings.get("tutorialOn"),
        settings.get("livePath"),
        settings.get("soundInterval"),
        settings.get("restrictAlarm"),
        settings.get("restrictFrom"),
        settings.get("restrictTo"),
        settings.get("customAlarm"),
        settings.get("desktopNotifs"),
        settings.get("alarmVolume"),
        settings.get("hidePreview"),
        settings.get("alertOn"),
        settings.get("alertChange"),
        settings.get("alertOff"),
        settings.get("alertGames"),
        mutedChannels,
        settings.get("searchLim")
    ])
}

addon.port.on("onSettings", function (payload) {
    //console.log("Payload received")
    followedStreamers = payload[0]
    settings.set("updateInterval", payload[1])
    settings.set("soundAlarm", payload[2])
    settings.set("alarmLimit", payload[3])
    settings.set("alarmLength", payload[4])
    settings.set("uniqueIds", payload[5])
    streamIds = payload[6]
    settings.set("darkMode", payload[7])
    settings.set("liveQuality", payload[8])
    settings.set("hideAvatar", payload[9])
    settings.set("hideOffline", payload[10])
    settings.set("sortMethod", payload[11])
    settings.set("openTab", payload[12])
    settings.set("openLive", payload[13])
    settings.set("openPopout", payload[14])
    settings.set("previewWait", payload[15])
    settings.set("tutorialOn", payload[16])
    settings.set("livePath", payload[17])
    curVersion = payload[18]
    settings.set("soundInterval", payload[19])
    settings.set("restrictAlarm", payload[20])
    settings.set("restrictFrom", payload[21])
    settings.set("restrictTo", payload[22])
    settings.set("customAlarm", payload[23])
    settings.set("desktopNotifs", payload[24])
    settings.set("alarmVolume", payload[25])
    settings.set("hidePreview", payload[26])
    settings.set("alertOn", payload[27])
    settings.set("alertChange", payload[28])
    settings.set("alertOff", payload[29])
    followedGames = payload[30]
    settings.set("alertGames", payload[31])
    mutedChannels = payload[32]
    authorized = (payload[33] != "") ? true : false
    settings.set("searchLim", payload[34])

    updateSettings()
})