followedStreamers = []

updateInterval = 1
soundAlarm = true
alarmLimit = false
alarmLength = 10
uniqueIds = false
streamIds = []
deBounce = 60

liveQuality = "best"
hideInfo = false
hideOffline = false
sortMethod = "recent"
openTab = true
openLive = false
openPopout = false
previewWait = 30

followClear = document.getElementById("followdefault")
followAdd = document.getElementById("followinput")
followSubmit = document.getElementById("followsubmit")
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
alarmDeb = document.getElementById("debounce")
alarmId = document.getElementById("uniqueids")

interDefault = document.getElementById("interfacedefault")
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

//Follower settings

followClear.onclick=function() {
    followedStreamers = []
    updateSettings()
}

followSubmit.onclick=function() {
    if (followAdd.value!="") {
        var curvalue = followAdd.value
        curvalue = curvalue.replace(/ /g, "");
        curvalue = curvalue.toLowerCase()
        followedStreamers.unshift(curvalue)
        updateSettings()
    }
    followAdd.value=""
}

followRemove.onclick=function() {
    if (followList.selectedIndex != "-1") {
       followedStreamers.splice(followList.selectedIndex, 1)
       updateSettings()
    }
}

followImport.onclick=function() {
    if (followImporter.value!="") {
        addon.port.emit("importUser", followImporter.value)
    }
    followImporter.value = ""
}

//Alarm settings

alarmDefault.onclick=function() {
updateInterval = 1
soundAlarm = true
alarmLimit = false
alarmLength = 10
uniqueIds = false
streamIds = []
deBounce = 60
updateSettings()
}

alarmWait.onchange=function() {
    updateInterval = alarmWait.value
    updateSettings()
}

alarmSound.onchange=function() {
    soundAlarm = alarmSound.checked
    updateSettings()
}

alarmLim.onchange=function() {
    alarmLimit = alarmLim.checked
    updateSettings()
}

alarmLen.onchange=function() {
    alarmLength = alarmLen.value
    updateSettings()
}

alarmDeb.onchange=function() {
    deBounce = alarmDeb.value
    updateSettings()
}

alarmId.onchange=function() {
    uniqueIds = alarmId.checked
    updateSettings()
}

//Interface settings

interDefault.onclick=function() {
    liveQuality = "best"
    hideInfo = false
    hideOffline = false
    sortMethod = "recent"
    openTab = true
    openLive = false
    openPopout = false
    previewWait = 30
    updateSettings()
}

interRecent.onclick=function() {
    if (interRecent.checked) {
        sortMethod = "recent"
    } else if (interViewers.checked) {
        sortMethod = "viewers"
    }
    updateSettings()
}

interViewers.onclick=function() {
    if (interRecent.checked) {
        sortMethod = "recent"
    } else if (interViewers.checked) {
        sortMethod = "viewers"
    }
    updateSettings()
}

interPreview.onchange=function() {
    previewWait = interPreview.value
    updateSettings()
}

interHideoff.onchange=function() {
    hideOffline = interHideoff.checked
    updateSettings()
}

interHideinfo.onchange=function() {
    hideInfo = interHideinfo.checked
    updateSettings()
}

interTab.onchange=function() {
    openTab = interTab.checked
    updateSettings()
}

interLive.onchange=function() {
    openLive = interLive.checked
    updateSettings()
}

interChat.onchange=function() {
    openPopout = interChat.checked
    updateSettings()
}

interQual.onchange=function() {
    liveQuality = interQual.value
    updateSettings()
}



//Rest of script

function updateFollowed() {
    while (followList.firstChild) {
        followList.removeChild(followList.firstChild);
    }
    for (var key in followedStreamers) {
        var newCard = document.createElement("option")
        newCard.value = followedStreamers[key]
        newCard.textContent = followedStreamers[key]
        followList.appendChild(newCard)
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
    alarmDeb.value = deBounce
    alarmId.checked = uniqueIds
    
    if (sortMethod=="recent") {
        interRecent.checked = true
        interViewers.checked = false
    } else if (sortMethod=="viewers"){
        interViewers.checked = true
        interRecent.checked= false
    }
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
    if (liveQuality=="best") {
        interQual.selectedIndex = 0
    } else if (liveQuality=="source") {
        interQual.selectedIndex = 1
    } else if (liveQuality=="high") {
        interQual.selectedIndex = 2
    } else if (liveQuality=="medium") {
        interQual.selectedIndex = 3
    } else if (liveQuality=="low") {
        interQual.selectedIndex = 4
    } else if (liveQuality=="mobile") {
        interQual.selectedIndex = 5
    } else if (liveQuality=="worst") {
        interQual.selectedIndex = 6
    } else if (liveQuality=="audio") {
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
        previewWait
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
    updateFollowed()
    updateSettings()
})