/*jshint bitwise: true, curly: true, eqeqeq: true, forin: true, freeze: true, nocomma: true, noarg: true, nonbsp: true, nonew: true, singleGroups: true, plusplus: true, undef: true, latedef: true, moz: true*/
/* global Audio, self, window, console */

var audio = new Audio();
var interval;
var on = false;
var period = 1000;

function play() {
    audio.play();
}

self.port.on("set", function() {
    audio.load();
    interval = window.setInterval(play, period);
    audio.play();
    on = true;
});

self.port.on("play", function() {
    audio.load();
    audio.play();
});

self.port.on("end", function() {
    window.clearInterval(interval);
    audio.pause();
    on = false;
});

self.port.on("update", function(settings, fileURI){
    audio.volume = settings.alarmVolume / 100;
    audio.src = settings.alarmPath ? settings.alarmPath.search("http://") > -1 || settings.alarmPath.search("https://") > -1 ? settings.alarmPath : fileURI : "alarm.ogg";
    period = settings.alarmInterval * 1000;
    if (on) {
        window.clearInterval(interval);
        audio.pause();
        interval = window.setInterval(play, period);
        audio.play();
    }
});