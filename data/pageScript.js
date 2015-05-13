onlineStreamers = []
onlineGames = []
onlineTitles = []
onlineViewers = []
onlinePreviews = []
onlineAvatars = []

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

function generateCard(status, name) {
    //0 = last streamer, 1 = normal online streamer, 2 = offline streamer
    if (status == 2) {
        var mainLi = document.createElement("li")
        mainLi.id = name
        var mainA = document.createElement("a")
        mainA.id = name + "!"
        mainA.href = "#"
        mainA.tabindex = "1"
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
        var preview = onlinePreviews[namekey]
        var avatar = onlineAvatars[namekey]

        var mainLi = document.createElement("li")
        mainLi.id = name

        var mainA = document.createElement("a")
        mainA.href = "#"
        mainA.tabindex = "1"
        mainA.className = "option"
        mainA.id = name + "!"

        var mainTable = document.createElement("table")
        if (status == 1) {
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
        img3.src = preview
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
        span2.textContent = ' "' + title + '"'
        td2.appendChild(span2)
        tr2.appendChild(td2)


        var tr3 = document.createElement("tr")
        var td3 = document.createElement("td")
        var img5 = document.createElement("img")
        img5.alt = ""
        img5.src = "game.png"
        td3.appendChild(img5)
        var bold2 = document.createElement("strong")
        bold2.textContent = " " + game
        td3.appendChild(bold2)
        tr3.appendChild(td3)


        var tr4 = document.createElement("tr")
        var td4 = document.createElement("td")
        var img6 = document.createElement("img")
        img6.alt = ""
        img6.src = "viewers.png"
        td4.appendChild(img6)
        var span3 = document.createElement("span")
        span3.textContent = " " + viewers
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

    if (onlineStreamers[0]) {
        var lastElement = generateCard(0, onlineStreamers[0])
        document.getElementById("!lastonline").appendChild(lastElement)
            //'<li> <a href="#" tabindex="1" class="option" id="' + lastStreamer + '"> <span style="color:blue"> <b> ' + lastStreamer + ": </b> </span> Playing " + lastGame + '</a></li> '
    }

    for (var key in onlineStreamers) {
        if (key != 0) {
            var onlineElement = generateCard(1, onlineStreamers[key])
            document.getElementById("!online").appendChild(onlineElement)
                //<li> <a href="#" tabindex="1" class="option" id="' + onlineStreamers[key] + '"> <span style="color:blue">  <b>' + onlineStreamers[key] + ": </b> </span> Playing " + onlineGames[key] + '</a></li> '
        }
    }

    for (var key in offlineStreamers) {
        if (offlineStreamers[key] != "") {
            var offlineElement = generateCard(2, offlineStreamers[key])
            document.getElementById("!offline").appendChild(offlineElement)
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
    onlineStreamers = payload[0]
    onlineGames = payload[1]
    onlineTitles = payload[2]
    onlineViewers = payload[3]
    onlinePreviews = payload[4]
    onlineAvatars = payload[5]
    offlineStreamers = payload[6]
    alarmOn = payload[7]
    followedStreamers = payload[8]
    updateList()
})

updateList()