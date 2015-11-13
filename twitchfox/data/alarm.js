var interval = null
var type_ = null
var volume = null
var url = null
var path = null
var aud = null
var aud_interval = null

function playAlarm() {
    aud.play()
}

self.port.on("startAlarm", function(payload) {
    //console.log("Payload received")
    interval = payload[0]
    type_ = payload[1]
    volume = payload[2]
    url = payload[3]
    path = payload[4]

    if (type_ == 0) {
        aud = new Audio(url)
        aud.volume = volume / 100
        aud_interval = setInterval(playAlarm, interval * 1000)
            //console.log("Alarm started - From website")
    } else if (type_ == 1) {
        aud = new Audio(path)
        aud.volume = volume / 100
        aud_interval = setInterval(playAlarm, interval * 1000)
            //console.log("Alarm started - From path")
    } else if (type_ == 2) {
        aud = new Audio('alert2.ogg')
        aud.volume = volume / 100
        aud_interval = setInterval(playAlarm, interval * 1000)
            //console.log("Alarm started - Default")
    }
})

self.port.on("volumeChange", function(payload) {
    if (aud) {
        aud.volume = payload / 100
    }
})

self.port.on("stopAlarm", function() {
    clearInterval(aud_interval)
    if (aud) {
        aud.pause()
    }
    //console.log("Alarm stopped")
})