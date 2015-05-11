lastStreamer = null
lastGame = null
onlineStreamers = []
onlineGames = null
offlineStreamers = []
alarmOn = false
followedStreamers = []

function onClick(obj) {
    obj.onclick = function() {
        addon.port.emit("openTab", obj.id)
    }
}



function updateList() {
    var alarmbtn = null
    var part0 = ""
    var part1 = "<h1>Latest online streamer</h1> <ul> "
    var part2 = ""
    var part3 = "</ul> <hr> <h1>Other online streamers</h1> <ul> "
    var part4 = ""
    var part5 = "</ul> <hr> <h1>Offline streamers</h1> <ul> "
    var part6 = ""
    var part7 = "</ul>"

    if (alarmOn) {
        part0 = '<li> <h1> <a style="color:lime" href="#" tabindex="1" class="option" id="alarm">Click to end alarm</a></h1></li> '
    }

    if (lastStreamer) {
        part2 = '<li> <a href="#" tabindex="1" class="option" id="' + lastStreamer + '"> <span style="color:blue"> <b> ' + lastStreamer + ": </b> </span> Playing " + lastGame + '</a></li> '
    }

    for (var key in onlineStreamers) {
        if (key != (onlineStreamers.length - 1)) {
            part4 = part4 + '<li> <a href="#" tabindex="1" class="option" id="' + onlineStreamers[key] + '"> <span style="color:blue">  <b>' + onlineStreamers[key] + ": </b> </span> Playing " + onlineGames[key] + '</a></li> '
        }
    }

    for (var key in offlineStreamers) {
        if (offlineStreamers[key] != "") {
            part6 = part6 + '<li> <a style="color:red" href="#" tabindex="1" class="option" id="' + offlineStreamers[key] + '">' + offlineStreamers[key] + '</a></li> '
        }
    }

    var complete = part0 + part1 + part2 + part3 + part4 + part5 + part6 + part7

    document.body.innerHTML = complete

    var alarmbtn = document.getElementById("alarm")
    if (alarmbtn) {
        alarm.onclick = function() {
            addon.port.emit("endAlarm", "End the alarm!");
        };
    }

    for (var key in followedStreamers) {
        if (document.getElementById(followedStreamers[key])) {
            onClick(document.getElementById(followedStreamers[key]))
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