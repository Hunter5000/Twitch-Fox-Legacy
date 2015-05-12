lastStreamer = null
lastGame = null
onlineStreamers = []
onlineGames = []
offlineStreamers = []
alarmOn = false
followedStreamers = []

function onClick(obj) {
    obj.onclick = function() {
        addon.port.emit("openTab", (obj.id.substring(0, obj.id.length - 1)))
    }
}

function containsValue(list_, obj) {
    if ((list_.indexOf(obj)) > -1) {
        return true
    } else {
        return false
    }
}

function updateList() {
    var alarmbtn = null


    var headers = [document.getElementById("!lastonline"), document.getElementById("!online"), document.getElementById("!offline")]

    for (var key in headers) {
        while (headers[key].firstChild) {
            headers[key].removeChild(headers[key].firstChild);
        }
    }

    if (alarmOn) {
        if (!document.getElementById("!alarm")) {
            var alarmElement = document.createElement("li");
            var alarmhead = document.createElement("h1")
            var alarmA = document.createElement("a")
            alarmElement.id = "!alarm"
            alarmA.id = "!alarm!"
            alarmA.textContent = ("Click to end alarm")
            alarmA.setAttribute("class", "option")
            alarmA.href = "#"
            alarmA.tabindex = "1"
            alarmA.style.color = "lime"
            alarmhead.appendChild(alarmA)
            alarmElement.appendChild(alarmhead)
            document.body.insertBefore(alarmElement, document.body.childNodes[0])
                //'<li> <h1> <a style="color:lime" href="#" tabindex="1" class="option" id="alarm">Click to end alarm</a></h1></li> '
        }

    } else if (!(alarmOn) && document.getElementById("!alarm")) {
        document.body.removeChild(document.getElementById("!alarm"))
    }

    if (lastStreamer) {
        var lastElement = document.createElement("li");
        lastElement.id = lastStreamer
        var lastA = document.createElement("a")
        var lastBold = document.createElement("b")
        var lastSpan = document.createElement("span")
        var lastSpan2 = document.createElement("span2")
        lastA.id = lastStreamer + "!"
        lastA.href = "#"
        lastA.tabindex = "1"
        lastA.setAttribute("class", "option")
        lastBold.textContent = lastStreamer + ":"
        lastSpan.style.color = "blue"
        lastSpan2.textContent = " Playing " + lastGame
        lastSpan.appendChild(lastBold)
        lastA.appendChild(lastSpan)
        lastA.appendChild(lastSpan2)
        lastElement.appendChild(lastA)
        document.getElementById("!lastonline").appendChild(lastElement)
            //'<li> <a href="#" tabindex="1" class="option" id="' + lastStreamer + '"> <span style="color:blue"> <b> ' + lastStreamer + ": </b> </span> Playing " + lastGame + '</a></li> '
    }

    for (var key in onlineStreamers) {
        if (key != (onlineStreamers.length - 1)) {
            var onlineElement = document.createElement("li")
            onlineElement.id = onlineStreamers[key]
            var onlineA = document.createElement("a")
            var onlineSpan = document.createElement("span")
            var onlineSpan2 = document.createElement("span")
            var onlineSpan = document.createElement("span")
            onlineA.id = onlineStreamers[key] + "!"
            onlineA.href = "#"
            onlineA.tabindex = "1"
            onlineA.setAttribute("class", "option")
            onlineSpan.style.color = "blue"
            onlineSpan.textContent = onlineStreamers[key] + ":"
            onlineSpan2.textContent = " Playing " + onlineGames[key]
            onlineA.appendChild(onlineSpan)
            onlineA.appendChild(onlineSpan2)
            onlineElement.appendChild(onlineA)
            document.getElementById("!online").insertBefore(onlineElement, document.getElementById("!online").childNodes[0])
                //<li> <a href="#" tabindex="1" class="option" id="' + onlineStreamers[key] + '"> <span style="color:blue">  <b>' + onlineStreamers[key] + ": </b> </span> Playing " + onlineGames[key] + '</a></li> '
        }
    }

    for (var key in offlineStreamers) {
        if (offlineStreamers[key] != "") {
            var offlineElement = document.createElement("li")
            offlineElement.id = offlineStreamers[key]
            var offlineA = document.createElement("a")
            offlineA.id = onlineStreamers[key] + "!"
            offlineA.href = "#"
            offlineA.tabindex = "1"
            offlineA.setAttribute("class", "option")
            offlineA.id = offlineStreamers[key] + "!"
            offlineA.textContent = offlineStreamers[key]
            offlineA.style.color = "red"
            offlineElement.appendChild(offlineA)
            document.getElementById("!offline").insertBefore(offlineElement, document.getElementById("!offline").childNodes[0])
                //'<li> <a style="color:red" href="#" tabindex="1" class="option" id="' + offlineStreamers[key] + '">' + offlineStreamers[key] + '</a></li> '
        }
    }

    var alarmbtn = document.getElementById("!alarm!")
    if (alarmbtn) {
        alarmbtn.onclick = function() {
            addon.port.emit("endAlarm", "End the alarm!");
        };
    }

    for (var key in followedStreamers) {
        if (document.getElementById(followedStreamers[key] + "!")) {
            onClick(document.getElementById(followedStreamers[key] + "!"))
        }
    }

}

addon.port.on("updatePage", function(payload) {
    //console.log("Payload received")
    lastStreamer = payload[0]
    lastGame = payload[1]
    onlineStreamers = payload[2]
    onlineGames = payload[3]
    offlineStreamers = payload[4]
    alarmOn = payload[5]
    followedStreamers = payload[6]
    updateList()
})

updateList()