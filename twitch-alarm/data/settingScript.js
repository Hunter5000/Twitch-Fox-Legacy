//Follower variables
followedStreamers = null

//Alarm variables

updateInterval = null
soundAlarm = null
alarmLimit = null
alarmLength = null
uniqueIds = null
streamIds = null
deBounce = null

//Interface variables

liveQuality = null
hideInfo = null
hideOffline = null
sortMethod = null
openTab = null
openLive = null
openPopout = null
previewWait = null
tutorialOn = null

//Other variables

curVersion = null

//Settings variables

searchTerm = ""
searchNum = 0

//HTML elements

followRefresh = document.getElementById("forcereload")
followClear = document.getElementById("followdefault")
followAdd = document.getElementById("followinput")
followSubmit = document.getElementById("followsubmit")
followP = document.getElementById("followedp")
followSearch = document.getElementById("followsearch")
followList = document.getElementById("followlist")
followRemove = document.getElementById("removeselected")
followImporter = document.getElementById("importinput")
followImport = document.getElementById("importsubmit")

alarmDefault = document.getElementById("alarmdefault")
alarmWait = document.getElementById("updatelen")
alarmSound = document.getElementById("soundalarm")
alarmMax = document.getElementById("maxalarm")
alarmLim = document.getElementById("alarmlimit")
alarmLen = document.getElementById("alarmlen")
alarmId = document.getElementById("uniqueids")

interDefault = document.getElementById("interfacedefault")
interTutorial = document.getElementById("tutorial")
interRadio = document.getElementById("sortradio")
interRecent = document.getElementById("sortrecent")
interViewers = document.getElementById("sortviewers")
interPreview = document.getElementById("previewwait")
interHideoff = document.getElementById("hideoff")
interHideinfo = document.getElementById("hideinfo")
interTab = document.getElementById("opentab")
interLive = document.getElementById("livestreamer")
interChat = document.getElementById("popout")
interSpan = document.getElementById("livespan")
interQual = document.getElementById("livequality")

versionSpan = document.getElementById("versionspan")

function containsValue(list, obj) {
    if ((list.indexOf(obj)) > -1) {
        return true
    } else {
        return false
    }
}

//Tabs

var tabLinks = new Array();
var contentDivs = new Array();

function init() {

    var tabListItems = document.getElementById('tabs').childNodes;
    for (var i = 0; i < tabListItems.length; i++) {
        if (tabListItems[i].nodeName == "LI") {
            var tabLink = getFirstChildWithTagName(tabListItems[i], 'A');
            var id = getHash(tabLink.getAttribute('href'));
            tabLinks[id] = tabLink;
            contentDivs[id] = document.getElementById(id);
        }
    }

    var i = 0;

    for (var id in tabLinks) {
        tabLinks[id].onclick = showTab;
        tabLinks[id].onfocus = function() {
            this.blur()
        };
        if (i == 0) tabLinks[id].className = 'selected';
        i++;
    }

    var i = 0;

    for (var id in contentDivs) {
        if (i != 0) contentDivs[id].className = 'tabContent hide';
        i++;
    }
}

function showTab() {
    var selectedId = getHash(this.getAttribute('href'));

    for (var id in contentDivs) {
        if (id == selectedId) {
            tabLinks[id].className = 'selected';
            contentDivs[id].className = 'tabContent';
        } else {
            tabLinks[id].className = '';
            contentDivs[id].className = 'tabContent hide';
        }
    }

    // Stop the browser following the link
    return false;
}

function getFirstChildWithTagName(element, tagName) {
    for (var i = 0; i < element.childNodes.length; i++) {
        if (element.childNodes[i].nodeName == tagName) return element.childNodes[i];
    }
}

function getHash(url) {
    var hashPos = url.lastIndexOf('#');
    return url.substring(hashPos + 1);
}

//Follower settings

followRefresh.onclick = function() {
    addon.port.emit("forceRefresh")
}

followClear.onclick = function() {
    followedStreamers = []
    updateSettings()
}

followSubmit.onclick = function() {
    if (followAdd.value != "") {
        var curvalue = followAdd.value
        curvalue = curvalue.replace(/ /g, "");
        curvalue = curvalue.replace(/\W/g, '')
        curvalue = curvalue.toLowerCase()
        if (!containsValue(followedStreamers, curvalue)) {
            followedStreamers.unshift(curvalue)
            updateSettings()
        }
    }
    followAdd.value = ""
}

followSearch.oninput = function() {
    searchTerm = followSearch.value
    updateFollowed()
}

followRemove.onclick = function() {
    if (followList.selectedIndex != "-1") {
        var indexkey = followedStreamers.indexOf(followList.value)
        followedStreamers.splice(indexkey, 1)
        updateSettings()
    }
}

followImport.onclick = function() {
    if (followImporter.value != "") {
        addon.port.emit("importUser", followImporter.value)
    }
    followImporter.value = ""
}

//Alarm settings

alarmDefault.onclick = function() {
    //Default alarm settings

    updateInterval = 1
    soundAlarm = true
    alarmLimit = false
    alarmLength = 10
    uniqueIds = true
    streamIds = []
    updateSettings()
}

alarmWait.onchange = function() {
    updateInterval = alarmWait.value
    updateSettings()
}

alarmSound.onchange = function() {
    soundAlarm = alarmSound.checked
    updateSettings()
}

alarmLim.onchange = function() {
    alarmLimit = alarmLim.checked
    updateSettings()
}

alarmLen.onchange = function() {
    alarmLength = alarmLen.value
    updateSettings()
}

alarmId.onchange = function() {
    uniqueIds = alarmId.checked
    updateSettings()
}

//Interface settings

interDefault.onclick = function() {
    //Default interface settings

    liveQuality = "best"
    hideInfo = false
    hideOffline = false
    sortMethod = "recent"
    openTab = true
    openLive = false
    openPopout = false
    previewWait = 30
    tutorialOn = true
    updateSettings()
}

interTutorial.onchange = function() {
    tutorialOn = interTutorial.checked
    updateSettings()
}

interRecent.onclick = function() {
    if (interRecent.checked) {
        sortMethod = "recent"
    } else if (interViewers.checked) {
        sortMethod = "viewers"
    }
    updateSettings()
}

interViewers.onclick = function() {
    if (interRecent.checked) {
        sortMethod = "recent"
    } else if (interViewers.checked) {
        sortMethod = "viewers"
    }
    updateSettings()
}

interPreview.onchange = function() {
    previewWait = interPreview.value
    updateSettings()
}

interHideoff.onchange = function() {
    hideOffline = interHideoff.checked
    updateSettings()
}

interHideinfo.onchange = function() {
    hideInfo = interHideinfo.checked
    updateSettings()
}

interTab.onchange = function() {
    openTab = interTab.checked
    updateSettings()
}

interLive.onchange = function() {
    openLive = interLive.checked
    updateSettings()
}

interChat.onchange = function() {
    openPopout = interChat.checked
    updateSettings()
}

interQual.onchange = function() {
    liveQuality = interQual.value
    updateSettings()
}



//Rest of script

function updateFollowed() {
    while (followList.firstChild) {
        followList.removeChild(followList.firstChild);
    }
    var searchcount = 0
    for (var key in followedStreamers) {
        if (followedStreamers[key].search(searchTerm) != -1) {
            searchcount += 1
            var newCard = document.createElement("option")
            newCard.value = followedStreamers[key]
            newCard.textContent = followedStreamers[key]
            followList.appendChild(newCard)
        }
    }
    searchNum = searchcount

    if (followedStreamers.length > 0) {
        if ((followedStreamers[0] != "") && (searchNum == followedStreamers.length)) {
            followP.textContent = "Followed streamers (" + followedStreamers.length + "):"
        } else if ((followedStreamers[0] != "") && (searchNum != followedStreamers.length)) {
            followP.textContent = "Followed streamers (" + followedStreamers.length + " total, showing " + searchNum + "):"
        } else {
            followP.textContent = "Followed streamers:"
        }
    } else {
        followP.textContent = "Followed streamers:"
    }
}

function updateSettings() {
    updateFollowed()

    alarmWait.value = updateInterval
    alarmSound.checked = soundAlarm
    alarmLim.checked = alarmLimit
    if (alarmLimit) {
        alarmMax.style.display = "inline"
    } else {
        alarmMax.style.display = "none"
    }
    alarmLen.value = alarmLength
    alarmId.checked = uniqueIds

    versionSpan.textContent = curVersion

    if (sortMethod == "recent") {
        interRecent.checked = true
        interViewers.checked = false
    } else if (sortMethod == "viewers") {
        interViewers.checked = true
        interRecent.checked = false
    }

    interTutorial.checked = tutorialOn
    interHideoff.checked = hideOffline
    interHideinfo.checked = hideInfo
    interTab.checked = openTab
    interLive.checked = openLive
    interChat.checked = openPopout
    interPreview.value = previewWait
    if (interLive.checked) {
        interSpan.style.display = "inline"
    } else {
        interSpan.style.display = "none"
    }
    if (liveQuality == "best") {
        interQual.selectedIndex = 0
    } else if (liveQuality == "source") {
        interQual.selectedIndex = 1
    } else if (liveQuality == "high") {
        interQual.selectedIndex = 2
    } else if (liveQuality == "medium") {
        interQual.selectedIndex = 3
    } else if (liveQuality == "low") {
        interQual.selectedIndex = 4
    } else if (liveQuality == "mobile") {
        interQual.selectedIndex = 5
    } else if (liveQuality == "worst") {
        interQual.selectedIndex = 6
    } else if (liveQuality == "audio") {
        interQual.selectedIndex = 7
    }

    exportSettings()
}

function exportSettings() {
    addon.port.emit("importSettings", [
        followedStreamers,
        updateInterval,
        soundAlarm,
        alarmLimit,
        alarmLength,
        uniqueIds,
        streamIds,
        deBounce,
        liveQuality,
        hideInfo,
        hideOffline,
        sortMethod,
        openTab,
        openLive,
        openPopout,
        previewWait,
        tutorialOn,
    ])
}

addon.port.on("onSettings", function(payload) {
    //console.log("Payload received")
    followedStreamers = payload[0]
    updateInterval = payload[1]
    soundAlarm = payload[2]
    alarmLimit = payload[3]
    alarmLength = payload[4]
    uniqueIds = payload[5]
    streamIds = payload[6]
    deBounce = payload[7]
    liveQuality = payload[8]
    hideInfo = payload[9]
    hideOffline = payload[10]
    sortMethod = payload[11]
    openTab = payload[12]
    openLive = payload[13]
    openPopout = payload[14]
    previewWait = payload[15]
    tutorialOn = payload[16]
    curVersion = payload[17]

    updateSettings()
})