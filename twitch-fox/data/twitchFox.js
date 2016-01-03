/*jshint bitwise: true, curly: true, eqeqeq: true, forin: true, freeze: true, nocomma: true, noarg: true, nonbsp: true, nonew: true, singleGroups: true, plusplus: true, undef: true, latedef: true, moz: true*/
/*globals document, addon, console, window, Blob, FileReader */

var settings;
var settingsMode = false;
var settingsTab = "follows";
var info = [];
var searchHistory = [];
var livestreamerReady = false;
var preSearchInfo = [];
var preSearchScrollY = 0;
var preSearchPrompt;
var preSettingsScrollY = 0;

var onlineChannels = 0;
var onlineGames = 0;

var restrictChange;

var l10n = {};

var infoContent = document.getElementById("infoContent");
var settingsContent = document.getElementById("settingsContent");
var previewContent = document.getElementById("previewContent");
var enlargedPreview = document.getElementById("enlargedPreview");
var searchBox = document.getElementById("search");
var followList = document.getElementById("followList");

var prompt;

//Everything this script does will need to be verified by the main script. Therefore, we will manage a system of requests to make sure both scripts are in sync.

var requests = {
    pending: [],
    send: function(request, message) {
        //console.log("Request sent: " + request);
        var key = this.pending.indexOf(request);
        if (key < 0) {
            if (this.pending.length === 0) {
                document.getElementById("refreshButton").className = "menuButton refresh thinking";
            }
            this.pending.push(request);
            addon.port.emit(request, message);
        }
    },
    remove: function(request) {
        //console.log("Request removed: " + request);
        var key = this.pending.indexOf(request);
        if (key > -1) {
            this.pending.splice(key, 1);
            if (this.pending.length === 0) {
                document.getElementById("refreshButton").className = "menuButton refresh";
            }
        }
    }
};

function getPosByProp(arr, prop, val) {
    var i;
    for (i = 0; i < arr.length; i += 1) {
        if (arr[i][prop] === val) {
            return i;
        }
    }
    return -1;
}

function alarmRestricted () {
	if (!settings.alarmRestrict) {return false;}
	var restrictFrom = Number(settings.alarmRestrictFrom.replace(/\D/g, ''));
	var restrictTo = Number(settings.alarmRestrictTo.replace(/\D/g, ''));
	var newDate = new Date();
	var newHours = String(newDate.getHours());
	var newMins = String(newDate.getMinutes());
	var newSecs = String(newDate.getSeconds());
	if (Number(newHours) < 10) {
		newHours = "0" + newHours;
	}
	if (Number(newMins) < 10) {
		newMins = "0" + newMins;
	}
	if (Number(newSecs) < 10) {
		newSecs = "0" + newSecs;
	}
	var curTime = Number(newHours + newMins + newSecs);
	return restrictTo <= restrictFrom ? curTime >= restrictFrom || curTime <= restrictTo : curTime >= restrictFrom && curTime <= restrictTo;
}

function Prompt() {
    this.type = "";
    this.display_name = "";
    this._id = "";
    this.name = "";
    this.url = "";
    this.online = 0;
    this.cause = "";
    this.creator = "";
}

prompt = new Prompt();

preSearchPrompt = prompt;

function createPrompt() {
	var followed = -1;
	var muted;
	switch (prompt.type) {
		case "channel":
			var followedChannels = settings.followedAuthInfo.followedChannels || settings.followedChannels;
			followed = Number(getPosByProp(followedChannels, "name", prompt.name) > -1);
			muted = settings.followedMutedChannels.indexOf(prompt.name) > -1;
			break;
		case "game":
			var followedGames = settings.followedAuthInfo.followedGames || settings.followedGames;
			followed = Number(getPosByProp(followedGames, "name", prompt.name) > -1);
			muted = settings.followedMutedGames.indexOf(prompt.name) > -1;
			break;
	}
	
    document.getElementById("promptIcon").className = "smallIcon " + prompt.type;

    document.getElementById("promptName").className = (prompt.type !== "video" ? "bold " : "small ") + (prompt.online || prompt.type === "video" ? "online" : "offline");
    document.getElementById("promptName").textContent = prompt.display_name;
    
    document.getElementById("promptFollow").style.display = followed > -1 ? "inline-block" : "none";  
    document.getElementById("promptFollow").className = followed ? "promptFollow followed" : "promptFollow";
    
    document.getElementById("promptVideos").style.display = prompt.type !== "video" ? "inline-block" : "none"; 
	document.getElementById("promptStreams").style.display = prompt.type === "game" && prompt.online ? "inline-block" : "none"; 
    
    document.getElementById("promptMute").style.display = followed === 1? "inline-block" : "none"; 
    document.getElementById("promptMute").className = muted ? "promptMute muted" : "promptMute";
    
    document.getElementById("openLive").style.display = livestreamerReady && (prompt.type === "channel" && prompt.online) || prompt.type === "video" ? "inline-block" : "none"; 
    
    document.getElementById("openPopout").style.display = prompt.type === "channel" && prompt.online ? "inline-block" : "none"; 
    document.getElementById("openChat").style.display = prompt.type === "channel" ? "inline-block" : "none"; 
    
    document.getElementById("liveStreamSpan").style.display = livestreamerReady && prompt.type === "channel" && prompt.online ? "inline" : "none";
    document.getElementById("liveVideoSpan").style.display = livestreamerReady && prompt.type === "video" ? "inline" : "none";
    document.getElementById("qualitySpan").style.display = "none";
    document.getElementById("qualitySelect").style.display = "none";
    document.getElementById("qualityFinding").style.display = "none";
    document.getElementById("qualityError").style.display = "none";
    
    document.getElementById("openVideoPopout").style.display = prompt.type === "video" ? "inline-block" : "none"; 
    
    document.getElementById("clickPrompt").className = "screenLock selected";
}

function msToHMS(time) {
    var s = Math.floor(time / 1000);
    var h = parseInt(s / 3600);
    s = s % 3600;
    var m = parseInt(s / 60);
    s = s % 60;
    if (m < 10 && h > 0) {
        m = "0" + m;
    }
    m+=":";
    if (h === 0){
        h = "";
    } else {
        h += ":";
    }
    if (s < 10) {
        s = "0" + s;
    }
    return h+m+s;
}

function createDate(time) {
    var a = new Date(time);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var output = "";
    if (l10n.separator === ",") {
        output = month + ' ' + date + ' ' + year;
    } else if (l10n.separator === ".") {
        output = date + ' ' + month + ' ' + year;
    }
    return output;
}

function getPosByProp(arr, prop, val) {
    var i;
    for (i = 0; i < arr.length; i += 1) {
        if (arr[i][prop] === val) {
            return i;
        }
    }
    return -1;
}

function getSelectValues(select) {
    var result = [];
    var options = select && select.options;
    for (var i = 0; i < options.length; i += 1) {
        if (options[i].selected && options[i].style.display !== "none") {
            result.push(options[i].value);
        }
    }
    return result;
}

function insSeparators(num) {
	num = num || 0;
    if (!isNaN(num)) {
        return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, l10n.separator);
    } else {
		return num;
	}
}

function onOpenStreamPopout(url) {
	url = url || prompt.url;
    window.open("http://www.twitch.tv/" + url + "/popout",'_blank','right=50,top=50,width=630,height=381,resizable=yes,scrollbars=no,toolbar=no,location=no,directories=no,status=no,menubar=no,copyhistory=no');
}

function onOpenChatPopout(url) {
	url = url || prompt.url;
    window.open("http://www.twitch.tv/" + url + "/chat?popout=",'_blank','right=50,top=50,width=400,height=600,resizable=yes,scrollbars=no,toolbar=no,location=no,directories=no,status=no,menubar=no,copyhistory=no');
}

function createInfoCard(obj) {
    var mainRow, mainCell, nameBlock, gameBlock, gameIcon, gameSpan, nameSpan, viewersBlock, viewersIcon, viewersSpan, viewsBlock, viewsIcon, viewsSpan, timeBlock, timeIcon, timeSpan, preview, previewCell, onChannelPrompt, onGamePrompt, onVideoPrompt, followedBlock, followedIcon;
	var infoCard = document.createElement("table");
	var followedChannels = settings.followedAuthInfo.followedChannels || settings.followedChannels;
	var followedGames = settings.followedAuthInfo.followedGames || settings.followedGames;
    switch (obj.type) {
        case "channel":
            infoCard.className = document.getElementById("!"+obj.name) ? "infoCard" : "infoCard fade";
			infoCard.id = "!" + obj.name;

			if (settings.interHideOffline && settings.interFollowedMode && !searchHistory.length && !obj.online) {
				return;
			}
			
            mainRow = document.createElement("tr");
            
            if (!settings.interHideAvatar && obj.logo) {
                var logoCell = document.createElement("td");
                var logo = document.createElement("div");
                logo.className = "logo";
                logo.style.backgroundImage = "url('" + obj.logo + "')";
                logoCell.appendChild(logo);
                mainRow.appendChild(logoCell);
            }
            
            mainCell = document.createElement("td");
            mainCell.className = "textInfo";
            
            if (getPosByProp(followedChannels, "name", obj.name) > -1 && (!settings.interFollowedMode || searchHistory.length)) {
                followedBlock = document.createElement("div");
                followedBlock.className = "infoBlock";
                followedIcon = document.createElement("div");
                followedIcon.className = "smallIcon followers";
                followedBlock.appendChild(followedIcon);
                mainCell.appendChild(followedBlock);
            }
			
            nameBlock = document.createElement("div");
            nameBlock.className = "infoBlock";
            var channelIcon = document.createElement("div");
            channelIcon.className = "smallIcon channel";
            nameBlock.appendChild(channelIcon);
            nameSpan = document.createElement("span");
            nameSpan.className = "bold " + (obj.online ? "online" : "offline");
            nameSpan.textContent = obj.display_name;
            nameBlock.appendChild(nameSpan);
            mainCell.appendChild(nameBlock);
            
            if (!isNaN(obj.viewers)) {
                viewersBlock = document.createElement("div");
                viewersBlock.className = "infoBlock";
                viewersIcon = document.createElement("div");
                viewersIcon.className = "smallIcon viewers";
                viewersBlock.appendChild(viewersIcon);
                viewersSpan = document.createElement("span");
                viewersSpan.textContent = insSeparators(obj.viewers);
                viewersBlock.appendChild(viewersSpan);
                mainCell.appendChild(viewersBlock);
            }
            
            if (obj.status) {
                var statusBlock = document.createElement("div");
                statusBlock.className = "infoBlock";
                var statusIcon = document.createElement("div");
                statusIcon.className = "smallIcon status";
                statusBlock.appendChild(statusIcon);
                var statusSpan = document.createElement("span");
                statusSpan.textContent = '"' + obj.status + '"';
                statusBlock.appendChild(statusSpan);
                mainCell.appendChild(statusBlock);
            }
            
            if (obj.game) {
                gameBlock = document.createElement("div");
                gameBlock.className = "infoBlock";
                gameIcon = document.createElement("div");
                gameIcon.className = "smallIcon game";
                gameBlock.appendChild(gameIcon);
                gameSpan = document.createElement("span");
                gameSpan.className = "bold game";
                gameSpan.textContent = obj.game;
                gameBlock.appendChild(gameSpan);
                mainCell.appendChild(gameBlock);
            }
            
            if (!isNaN(obj.views)) {
                viewsBlock = document.createElement("div");
                viewsBlock.className = "infoBlock";
                viewsIcon = document.createElement("div");
                viewsIcon.className = "smallIcon views";
                viewsBlock.appendChild(viewsIcon);
                viewsSpan = document.createElement("span");
                viewsSpan.textContent = insSeparators(obj.views);
                viewsBlock.appendChild(viewsSpan);
                mainCell.appendChild(viewsBlock);
            }
            
            if (!isNaN(obj.followers)) {
                var followersBlock = document.createElement("div");
                followersBlock.className = "infoBlock";
                var followersIcon = document.createElement("div");
                followersIcon.className = "smallIcon followers";
                followersBlock.appendChild(followersIcon);
                var followersSpan = document.createElement("span");
                followersSpan.textContent = insSeparators(obj.followers);
                followersBlock.appendChild(followersSpan);
                mainCell.appendChild(followersBlock);
            }
            
            if (obj.time) {
                timeBlock = document.createElement("div");
                timeBlock.className = "infoBlock";
                timeIcon = document.createElement("div");
                timeIcon.className = "smallIcon time";
                timeBlock.appendChild(timeIcon);
                var onlineForSpan = document.createElement("span");
                onlineForSpan.textContent = l10n.onlineFor + " ";
                timeBlock.appendChild(onlineForSpan);
                timeSpan = document.createElement("span");
                timeSpan.className = "bold";
                timeSpan.textContent = msToHMS(Date.now() - obj.time);
                timeBlock.appendChild(timeSpan);
                mainCell.appendChild(timeBlock);
            }
            
            mainRow.appendChild(mainCell);
            
            if (!settings.interHidePreview && obj.online) {
                previewCell = document.createElement("td");
                preview = document.createElement("div");
                preview.className = "preview";
                preview.style.backgroundImage = "url('http://static-cdn.jtvnw.net/previews-ttv/live_user_" + obj.name + "-139x78.jpg')";
                previewCell.appendChild(preview);
                mainRow.appendChild(previewCell);
            }
            
            infoCard.appendChild(mainRow);
            
            onChannelPrompt = function() {
                prompt = new Prompt();

                prompt.type = obj.type;
                prompt.name = obj.name;
                prompt.url = obj.name;
                prompt.display_name = obj.display_name;
                prompt.online = obj.online;
                prompt.cause = searchHistory.length && searchHistory[searchHistory.length - 1].type || settings.interMode;

                createPrompt();
            };
            
			onGamePrompt = function() {
                prompt = new Prompt();

                prompt.type = "game";
                prompt.name = obj.game;
                prompt.url = "directory/game/" + obj.game;
                prompt.display_name = obj.game;
                prompt.online = true;
                prompt.cause = searchHistory.length && searchHistory[searchHistory.length - 1].type || settings.interMode;

                createPrompt();
			};
			
            infoCard.onclick = function(ev) {
                if (ev.target.className === "preview") {
                    previewContent.className = "screenLock selected";
                    enlargedPreview.className = "preview enlarged";
                    enlargedPreview.style.backgroundImage = "url('http://static-cdn.jtvnw.net/previews-ttv/live_user_" + obj.name + "-640x360.jpg')";
                } else if (ev.target.className === "bold game") {
					onGamePrompt();
				} else {
					if (obj.online) {
						if (settings.interOpenPopup) {
							onChannelPrompt();
						}
						if (settings.interOpenPage) {
							requests.send("openTab", obj.name);
						}
						if (settings.interOpenLive && livestreamerReady) {
							requests.send("openLiveUncertain", {url: obj.name, quality: settings.interLivestreamerQuality});
						}
						if (settings.interOpenPopout) {
							onOpenStreamPopout(obj.name);
						}
						if (settings.interOpenChat) {
							onOpenChatPopout(obj.name);
						}
					} else {
						onChannelPrompt();
					}
                }
            };
            
            infoCard.oncontextmenu = function() {
                onChannelPrompt();
            };
            
            return infoCard;
        case "game":
            infoCard.className = document.getElementById("!"+obj.name) ? "infoCard half" : "infoCard half fade";
            infoCard.id = "!" + obj.name;

            mainRow = document.createElement("tr");
            
            var boxArtCell = document.createElement("td");
            var boxArt = document.createElement("div");
            boxArt.className = "boxArt";
            boxArt.style.backgroundImage = "url('http://static-cdn.jtvnw.net/ttv-boxart/" + obj.name + "-56x78.jpg')";
            boxArtCell.appendChild(boxArt);
            mainRow.appendChild(boxArtCell);
            
            mainCell = document.createElement("td");
            mainCell.className = "textInfo";
            
            if (getPosByProp(followedGames, "name", obj.name) > -1 && (!settings.interFollowedMode || searchHistory.length)) {
                followedBlock = document.createElement("div");
                followedBlock.className = "infoBlock";
                followedIcon = document.createElement("div");
                followedIcon.className = "smallIcon followers";
                followedBlock.appendChild(followedIcon);
                mainCell.appendChild(followedBlock);
            }
			
            nameBlock = document.createElement("div");
            nameBlock.className = "infoBlock";
            gameIcon = document.createElement("div");
            gameIcon.className = "smallIcon game";
            nameBlock.appendChild(gameIcon);
            nameSpan = document.createElement("span");
            nameSpan.className = "bold " + (obj.online ? "online" : "offline");
            nameSpan.textContent = obj.name;
            nameBlock.appendChild(nameSpan);
            mainCell.appendChild(nameBlock);
            
            if (!isNaN(obj.viewers)) {
                viewersBlock = document.createElement("div");
                viewersBlock.className = "infoBlock";
                viewersIcon = document.createElement("div");
                viewersIcon.className = "smallIcon viewers";
                viewersBlock.appendChild(viewersIcon);
                viewersSpan = document.createElement("span");
                viewersSpan.textContent = insSeparators(obj.viewers);
                viewersBlock.appendChild(viewersSpan);
                mainCell.appendChild(viewersBlock);
            }
            
            if (!isNaN(obj.channels)) {
                var channelsBlock = document.createElement("div");
                channelsBlock.className = "infoBlock";
                var channelsIcon = document.createElement("div");
                channelsIcon.className = "smallIcon status";
                channelsBlock.appendChild(channelsIcon);
                var channelsSpan = document.createElement("span");
                channelsSpan.textContent = insSeparators(obj.channels);
                channelsBlock.appendChild(channelsSpan);
                mainCell.appendChild(channelsBlock);
            }
            
            mainRow.appendChild(mainCell);
             
            infoCard.appendChild(mainRow);
            
            onGamePrompt = function() {
                prompt = new Prompt();

                prompt.type = obj.type;
                prompt.name = obj.name;
                prompt.url = "directory/game/" + obj.name;
                prompt.display_name = obj.name;
                prompt.online = obj.online;
                prompt.cause = searchHistory.length && searchHistory[searchHistory.length - 1].type || settings.interMode;

                createPrompt();
            };
			
            infoCard.onclick = function() {
				if (obj.online) {
					requests.send("searchDirectory", {type: "getGameStreams", target: obj.name, scrollY: window.scrollY, prompt: prompt});
				} else {
					onGamePrompt();
				}
            };
			
            infoCard.oncontextmenu = function() {
                onGamePrompt();
            };
            
            return infoCard;
        case "video":
            infoCard.className = document.getElementById("!"+obj._id) ? "infoCard" : "infoCard fade";
			infoCard.id = "!" + obj._id;

            mainRow = document.createElement("tr");
            
            mainCell = document.createElement("td");
            mainCell.className = "textInfo";
            
            var titleBlock = document.createElement("div");
            titleBlock.className = "infoBlock";
            var videoIcon = document.createElement("div");
            videoIcon.className = "smallIcon video";
            titleBlock.appendChild(videoIcon);
            var titleSpan = document.createElement("span");
            titleSpan.className = "bold online";
            titleSpan.textContent = obj.title;
            titleBlock.appendChild(titleSpan);
            mainCell.appendChild(titleBlock);
            
            nameBlock = document.createElement("div");
            nameBlock.className = "infoBlock";
            channelIcon = document.createElement("div");
            channelIcon.className = "smallIcon channel";
            nameBlock.appendChild(channelIcon);
            nameSpan = document.createElement("span");
            nameSpan.className = "bold channel";
            nameSpan.textContent = obj.display_name;
            nameBlock.appendChild(nameSpan);
            mainCell.appendChild(nameBlock);
            
			if (obj.game) {
				gameBlock = document.createElement("div");
				gameBlock.className = "infoBlock";
				gameIcon = document.createElement("div");
				gameIcon.className = "smallIcon game";
				gameBlock.appendChild(gameIcon);
				gameSpan = document.createElement("span");
				gameSpan.className = "bold game";
				gameSpan.textContent = obj.game;
				gameBlock.appendChild(gameSpan);
				mainCell.appendChild(gameBlock);
			}
            
            viewsBlock = document.createElement("div");
            viewsBlock.className = "infoBlock";
            viewsIcon = document.createElement("div");
            viewsIcon.className = "smallIcon views";
            viewsBlock.appendChild(viewsIcon);
            viewsSpan = document.createElement("span");
            viewsSpan.textContent = insSeparators(obj.views);
            viewsBlock.appendChild(viewsSpan);
            mainCell.appendChild(viewsBlock);
            
            timeBlock = document.createElement("div");
            timeBlock.className = "infoBlock";
            timeIcon = document.createElement("div");
            timeIcon.className = "smallIcon time";
            timeBlock.appendChild(timeIcon);
            timeSpan = document.createElement("span");
            timeSpan.className = "bold";
            timeSpan.textContent = msToHMS(obj.length);
            timeBlock.appendChild(timeSpan);
            mainCell.appendChild(timeBlock);
            
            var recordedBlock = document.createElement("div");
            recordedBlock.className = "infoBlock";
            var recordedIcon = document.createElement("div");
            recordedIcon.className = "smallIcon status";
            recordedBlock.appendChild(recordedIcon);
            var recordedSpan = document.createElement("span");
            recordedSpan.textContent = l10n.recorded + " ";
            recordedBlock.appendChild(recordedSpan);
            var dateSpan = document.createElement("span");
            dateSpan.className = "bold";
            dateSpan.textContent = createDate(obj.time);
            recordedBlock.appendChild(dateSpan);
            mainCell.appendChild(recordedBlock);
            
            mainRow.appendChild(mainCell);

            previewCell = document.createElement("td");
            preview = document.createElement("div");
            preview.className = "preview";
            preview.style.backgroundImage = "url('" + obj.preview.replace("320", "139").replace("240", "78") + "')";
            previewCell.appendChild(preview);
            mainRow.appendChild(previewCell);
            
            infoCard.appendChild(mainRow); 
            
            onVideoPrompt = function() {
                prompt = new Prompt();

                prompt.type = obj.type;
                prompt.name = obj.name;
                prompt.url = obj.link;
                prompt._id = obj._id;
                prompt.display_name = obj.title;
                prompt.creator = obj.display_name;
                prompt.online = obj.online;
                prompt.cause = searchHistory.length && searchHistory[searchHistory.length - 1].type || settings.interMode;

                createPrompt();
            };
			
			onGamePrompt = function() {
                prompt = new Prompt();

                prompt.type = "game";
                prompt.name = obj.game;
                prompt.url = "directory/game/" + obj.game;
                prompt.display_name = obj.game;
                prompt.online = true;
                prompt.cause = searchHistory.length && searchHistory[searchHistory.length - 1].type || settings.interMode;

                createPrompt();
			};
			
            onChannelPrompt = function() {
                prompt = new Prompt();

                prompt.type = "channel";
                prompt.name = obj.name;
                prompt.url = obj.name;
                prompt.display_name = obj.display_name;
                prompt.online = false;
                prompt.cause = searchHistory.length && searchHistory[searchHistory.length - 1].type || settings.interMode;

                createPrompt();
            };
			
            infoCard.onclick = function(ev) {
                if (ev.target.className === "preview") {
                    previewContent.className = "screenLock selected";
                    enlargedPreview.className = "preview enlarged";
                    enlargedPreview.style.backgroundImage = "url('" + obj.preview.replace("320", "640").replace("240", "360") + "')";
				} else if (ev.target.className === "bold game") {
					onGamePrompt();
				} else if (ev.target.className === "bold channel") {
					onChannelPrompt();
                } else {
                    onVideoPrompt();
                }
            };
            
            infoCard.oncontextmenu = function() {
                onVideoPrompt();
            };
            
            return infoCard;
    }
}

function updateUI() {
	if (!settings) {return; }
    var tabs, i;
	
	var followedChannels = settings.followedAuthInfo.followedChannels || settings.followedChannels;
	var followedGames = settings.followedAuthInfo.followedGames || settings.followedGames;
	
	document.getElementById("styleLink").href = settings.interDarkMode ? "dark.css" : "light.css";
	
    document.getElementById("settingsButton").className = settingsMode ? "menuButton settings selected" : "menuButton settings";
    
	document.getElementById("muteElement").style.display = settingsMode ? "none" : "inline-block";
	document.getElementById("rightElement").style.display = settingsMode ? "none" : "inline-block";
	
	document.getElementById("downloadElement").style.display = settingsMode ? "inline-block" : "none";
	document.getElementById("uploadElement").style.display = settingsMode ? "inline-block" : "none";
	
	//It's safe practice to hide everything before we start showing stuff
	
	document.getElementById("refreshButton").style.display = "none";
	document.getElementById("searchButton").style.display = "none";
	document.getElementById("addButton").style.display = "none";
	document.getElementById("removeButton").style.display = "none";
	document.getElementById("settingsTabs").style.display = "none";
	document.getElementById("tabs").style.display = "none";
	document.getElementById("searchResults").style.display = "none";
	document.getElementById("searchTabs").style.display = "none";
	document.getElementById("backButton").style.display = "none";
	document.getElementById("followedButton").style.display = "none";
	document.getElementById("loginLogoutButton").style.display = "none";
	document.getElementById("followsSettings").style.display = "none";
	document.getElementById("alarmSettings").style.display = "none";
	document.getElementById("interfaceSettings").style.display = "none";
	document.getElementById("aboutSettings").style.display = "none";
	document.getElementById("importElement").style.display = "none";
	document.getElementById("clearElement").style.display = "none";
	searchBox.style.visibility = "hidden";
	document.getElementById("noFollowedChannels").style.display = "none";
	document.getElementById("noFollowedGames").style.display = "none";
	document.getElementById("noFollowedVideos").style.display = "none";
	document.getElementById("noResultsSpan").style.display = "none";
	
	searchBox.placeholder = "";
	
    infoContent.style.display = settingsMode ? "none" : "block";
    settingsContent.style.display = settingsMode ? "block" : "none";
	
	if (settingsMode) {
		document.getElementById("settingsTabs").style.display = "inline-block";
		document.getElementById("loginLogoutButton").style.display = "inline-block";
		document.getElementById("loginLogoutButton").className = "menuButton twitch" + (settings.followedAuthInfo.token ? "Logout" : "Login");
		document.getElementById("followsCounter").textContent = followedChannels.length || "";
		
		tabs = document.getElementById("settingsTabs").children;
		
		for (i = 0; i < tabs.length; i += 1) {
			tabs[i].className = "tabElement";
		}

		document.getElementById(settingsTab + "Tab").className = "tabElement selected";
		document.getElementById(settingsTab + "Settings").style.display = "inline-block";
		
		if (livestreamerReady) {
			document.getElementById("livestreamerStatus").className = "bold online";
			document.getElementById("livestreamerStatus").textContent = l10n.livestreamerReady;
		} else {
			document.getElementById("livestreamerStatus").className = "bold offline";
			document.getElementById("livestreamerStatus").textContent = l10n.livestreamerNotFound;
		}
		
		if (settingsTab === "follows") {
			searchBox.style.visibility = "visible";
			document.getElementById("importButton").className = "menuButton add";
			document.getElementById("addButton").className = "menuButton add";
			document.getElementById("removeButton").className = "menuButton remove";
			document.getElementById("addButton").style.display = "inline-block";
			searchBox.placeholder = settings.followedAuthInfo.display_name ? l10n.loggedIn + " " + settings.followedAuthInfo.display_name : l10n.filterAdd;
			
			if (settings.followedAuthInfo.token) {
				followList.size = "26";
			} else {
				followList.size = "22";
				document.getElementById("importElement").style.display = "inline-block";
				document.getElementById("clearElement").style.display = "inline-block";
			}
			
			followedChannels = followedChannels.sort(function(a,b) {
				if (a.display_name.toLowerCase() < b.display_name.toLowerCase()) {return -1; }
				if (a.display_name.toLowerCase() > b.display_name.toLowerCase()) {return 1; } 
				return 0;
			});
			
			var options = followList.cloneNode(true).children, found;
			
			//Remove options for channels that are no longer followed
			
			for (i = 0; i < options.length; i += 1) {
				if (getPosByProp(followedChannels, "name", options[i].value) < 0) {
					document.getElementById(options[i].id).remove();
				}
			}	
			
			for (i = 0; i < followedChannels.length; i += 1) {
				if (!document.getElementById("!!" + followedChannels[i].name)) {
					//Add options that didn't exist before
					var newOption = document.createElement("option");
					newOption.id = "!!" + followedChannels[i].name;
					newOption.value = followedChannels[i].name;
					newOption.textContent = followedChannels[i].display_name;
					followList.appendChild(newOption);
				}
				
				var thisOption = document.getElementById("!!" + followedChannels[i].name);
				
				if (thisOption) {
					//Update the appearance of existing options
					thisOption.className = settings.followedMutedChannels.indexOf(followedChannels[i].name) > -1 ? "offline" : "";
					if (followedChannels[i].display_name.toLowerCase().search(searchBox.value.toLowerCase()) > -1) {
						thisOption.style.display = "block";
						thisOption.style.visibility = "visible";
						found = true;
					} else {
						thisOption.style.display = "none";
					}
				}
			}
			if (followList.firstElementChild && !found) {
				followList.firstElementChild.style.display = "block";
				followList.firstElementChild.style.visibility = "hidden";
			}
		}
		
		document.getElementById("updateSpan").style.display = settings.alarmOnOnlineChannel || settings.alarmOnOfflineChannel || settings.alarmOnStatusChange || settings.alarmOnOnlineGame ? "inline" : "none";
		document.getElementById("restrictSpan").style.display = settings.alarmRestrict ? "inline" : "none";
		document.getElementById("soundSpan").style.display = settings.alarmSound ? "inline" : "none";
		document.getElementById("limitSpan").style.display = settings.alarmLimit ? "inline" : "none";
		document.getElementById("liveSpan").style.display = livestreamerReady ? "inline" : "none";
		document.getElementById("liveSpan2").style.display = settings.interOpenLive && livestreamerReady ? "inline" : "none";
		
		//Set the settings
		
		document.getElementById("alarmDisableIconFlashing").checked = settings.alarmDisableIconFlashing;
		document.getElementById("alarmInterval").value = settings.alarmInterval;
		document.getElementById("alarmLength").value = settings.alarmLength;
		document.getElementById("alarmLimit").checked = settings.alarmLimit;
		document.getElementById("alarmNotifs").checked = settings.alarmNotifs;
		document.getElementById("alarmOnOfflineChannel").checked = settings.alarmOnOfflineChannel;
		document.getElementById("alarmOnOnlineChannel").checked = settings.alarmOnOnlineChannel;
		document.getElementById("alarmOnOnlineGame").checked = settings.alarmOnOnlineGame;
		document.getElementById("alarmOnStatusChange").checked = settings.alarmOnStatusChange;
		document.getElementById("alarmPath").value = settings.alarmPath;
		document.getElementById("alarmRestrict").checked = settings.alarmRestrict;
		document.getElementById("alarmRestrictFrom").value = settings.alarmRestrictFrom;
		document.getElementById("alarmRestrictTo").value = settings.alarmRestrictTo;
		document.getElementById("alarmSound").checked = settings.alarmSound;
		document.getElementById("alarmUpdate").value = settings.alarmUpdate;
		document.getElementById("alarmVolume").value = settings.alarmVolume;
		
		document.getElementById("interDarkMode").checked = settings.interDarkMode;
		document.getElementById("interOpenPopup").checked = settings.interOpenPopup;
		document.getElementById("interOpenPage").checked = settings.interOpenPage;
		document.getElementById("interOpenLive").checked = settings.interOpenLive;
		document.getElementById("interOpenPopout").checked = settings.interOpenPopout;
		document.getElementById("interOpenChat").checked = settings.interOpenChat;
		document.getElementById("interHideAvatar").checked = settings.interHideAvatar;
		document.getElementById("interHideOffline").checked = settings.interHideOffline;
		document.getElementById("interHidePreview").checked = settings.interHidePreview;
		document.getElementById("interLivestreamerPath").value = settings.interLivestreamerPath;
		document.getElementById("interLivestreamerQuality").value = settings.interLivestreamerQuality;
		document.getElementById("interSearchLim").value = settings.interSearchLim;
	} else {
		tabs = document.getElementById("tabs").children;
		
		for (i = 0; i < tabs.length; i += 1) {
			tabs[i].className = "tabElement";
		}

		document.getElementById(settings.interMode + "Tab").className = "tabElement selected";
		document.getElementById("followedButton").className = "menuButton " + (settings.interFollowedMode ? "followed" : "twitch");
		document.getElementById("muteButton").className = settings.alarmSound && !alarmRestricted() ? "menuButton mute" : "menuButton unmute";
		document.getElementById("rightButton").className = "menuButton " + (searchHistory.length ? "home" : settings.interSortMethod + "Sort");
		
		searchBox.style.visibility = "visible";
		
		if (settings.interFollowedMode || settings.interMode === "videos" || searchHistory.length) {
			document.getElementById("refreshButton").style.display = "inline-block";
			document.getElementById("searchButton").style.display = "none";
		} else {
			document.getElementById("refreshButton").style.display = searchBox.value ? "none" : "inline-block";
			document.getElementById("searchButton").style.display = searchBox.value ? "inline-block" : "none";
		}
		
		document.getElementById("channelsCounter").textContent = onlineChannels || "";
		document.getElementById("gamesCounter").textContent = onlineGames || "";

		if (searchHistory.length) {
			document.getElementById("searchResults").style.display = "inline-block";
			document.getElementById("searchTabs").style.display = "inline-block";

			document.getElementById("backButton").style.display = "inline-block";
			
			searchBox.placeholder = l10n.filterSearchResults;

			document.getElementById("resultsCounter").textContent = searchHistory[searchHistory.length - 1].result.length;

			document.getElementById("showingSpan").style.display = "none";
			document.getElementById("resultsCounter").style.display = "none";
			document.getElementById("noResultsSpan").style.display = "none";
			document.getElementById("searchTarget").style.display = "none";
			document.getElementById("resultsFor").style.display = "none";
			document.getElementById("resultsIn").style.display = "none";
			document.getElementById("searchingSpan").style.display = "none";

			if (!searchHistory[searchHistory.length - 1].result.length && requests.pending.indexOf("infoUpdate") < 0) {
				document.getElementById("noResultsSpan").style.display = "inline";
			}
			
			if (requests.pending.length) {
				document.getElementById("searchingSpan").style.display = "inline";
			} else {
				document.getElementById("showingSpan").style.display = "inline";
				document.getElementById("resultsCounter").style.display = "inline";
				document.getElementById("searchTarget").style.display = "inline";
			}

			if (searchHistory[searchHistory.length - 1].type === "getHighlights" || searchHistory[searchHistory.length - 1].type === "channels") {
				document.getElementById("resultsTab").style.display = "none";
				document.getElementById("leftSearchTab").style.display = "inline-block";
				document.getElementById("rightSearchTab").style.display = "inline-block";
				document.getElementById("leftSearchTab").className = "tabElement selected";
				document.getElementById("rightSearchTab").className = "tabElement";

				document.getElementById("leftTabButton").className = "tabButton " + (searchHistory[searchHistory.length - 1].type === "channels" ? "generalChannels" : "highlights");
				document.getElementById("rightTabButton").className = "tabButton " + (searchHistory[searchHistory.length - 1].type === "channels" ? "channels" : "videos");

				if (!requests.pending.length) {
					document.getElementById("resultsFor").style.display = searchHistory[searchHistory.length - 1].fromUserInput ? "inline" : "none";
					document.getElementById("resultsIn").style.display = searchHistory[searchHistory.length - 1].fromUserInput ? "none" : "inline";
				}

				document.getElementById("searchTarget").textContent = searchHistory[searchHistory.length - 1].target;   
				document.getElementById("leftCounter").textContent = searchHistory[searchHistory.length - 1].total;
				document.getElementById("rightCounter").textContent = "";
			} else if (searchHistory[searchHistory.length - 1].type === "getBroadcasts" || searchHistory[searchHistory.length - 1].type === "streams") {
				document.getElementById("resultsTab").style.display = "none";
				document.getElementById("leftSearchTab").style.display = "inline-block";
				document.getElementById("rightSearchTab").style.display = "inline-block";
				document.getElementById("leftSearchTab").className = "tabElement";
				document.getElementById("rightSearchTab").className = "tabElement selected";

				document.getElementById("leftTabButton").className = "tabButton " + (searchHistory[searchHistory.length - 1].type === "streams" ? "generalChannels" : "highlights");
				document.getElementById("rightTabButton").className = "tabButton " + (searchHistory[searchHistory.length - 1].type === "streams" ? "channels" : "videos");

				if (!requests.pending.length) {
					document.getElementById("resultsFor").style.display = searchHistory[searchHistory.length - 1].fromUserInput ? "inline" : "none";
					document.getElementById("resultsIn").style.display = searchHistory[searchHistory.length - 1].fromUserInput ? "none" : "inline";
				}

				document.getElementById("searchTarget").textContent = searchHistory[searchHistory.length - 1].target;   
				document.getElementById("leftCounter").textContent = "";
				document.getElementById("rightCounter").textContent = searchHistory[searchHistory.length - 1].total;
			} else {
				document.getElementById("resultsTab").style.display = "inline-block";
				document.getElementById("leftSearchTab").style.display = "none";
				document.getElementById("rightSearchTab").style.display = "none";
				document.getElementById("searchType").className = "tabButton " + searchHistory[searchHistory.length - 1].resultType;

				if (!requests.pending.length) {
					document.getElementById("resultsFor").style.display = searchHistory[searchHistory.length - 1].fromUserInput ? "inline" : "none";
					document.getElementById("resultsIn").style.display = searchHistory[searchHistory.length - 1].fromUserInput ? "none" : "inline";
				}

				document.getElementById("searchTarget").textContent = searchHistory[searchHistory.length - 1].target;   
				document.getElementById("totalCounter").textContent = searchHistory[searchHistory.length - 1].total;
			}
		} else {
			document.getElementById("followedButton").style.display = "inline-block";

			document.getElementById("tabs").style.display = "inline-block";
			document.getElementById("searchResults").style.display = "none";
			document.getElementById("searchTabs").style.display = "none";

			switch (settings.interMode) {
				case "channels":
					searchBox.placeholder = settings.interFollowedMode ? l10n.filterFollowedChannels : l10n.searchChannels;
					document.getElementById("noFollowedChannels").style.display = followedChannels.length || !settings.interFollowedMode ? "none" : "inline";
					break;
				case "games":
					searchBox.placeholder = settings.interFollowedMode ? l10n.filterFollowedGames : l10n.searchGames;
					document.getElementById("noFollowedGames").style.display = followedGames.length || !settings.interFollowedMode ? "none" : "inline";
					break;
				case "videos":
					searchBox.placeholder = settings.interFollowedMode ? l10n.filterFollowedVideos : l10n.filterVideos;
					document.getElementById("noFollowedVideos").style.display = settings.followedAuthInfo.token || !settings.interFollowedMode ? "none" : "inline";
					break;
			}
		}
	}
}

function filterContent() {
	if (!settings) {return; }
    var cards = infoContent.children, filter = searchBox.value.toLowerCase(), key, thisInfo, nameSearch, gameSearch, statusSearch, titleSearch;
    for (var i = 0; i < cards.length; i += 1) {
        var card = cards[i], mode = searchHistory.length ? searchHistory[searchHistory.length - 1].resultType : settings.interMode;
        switch (mode) {
            case "channels":
			case "generalChannels":
                key = getPosByProp(info, "name", card.id.slice(1));
                if (key > -1) {
                    thisInfo = info[key];
                    nameSearch = thisInfo.display_name && thisInfo.display_name.toLowerCase().search(filter) + 1;
                    gameSearch = thisInfo.game && thisInfo.game.toLowerCase().search(filter) + 1;
                    statusSearch = thisInfo.status && thisInfo.status.toLowerCase().search(filter) + 1;
                }
                break;
            case "games":
                key = getPosByProp(info, "name", card.id.slice(1));
                if (key > -1) {
                    thisInfo = info[key];
                    nameSearch = thisInfo.name && thisInfo.name.toLowerCase().search(filter) + 1;
                }
                break;
            case "videos":
                key = getPosByProp(info, "_id", card.id.slice(1));
                if (key > -1) {
                    thisInfo = info[key];
                    nameSearch = thisInfo.display_name && thisInfo.display_name.toLowerCase().search(filter) + 1;
                    gameSearch = thisInfo.game && thisInfo.game.toLowerCase().search(filter) + 1;
                    titleSearch = thisInfo.title && thisInfo.title.toLowerCase().search(filter) + 1;
                }
                break;
        }
        card.style.display = nameSearch || gameSearch || statusSearch || titleSearch ? "inline-block" : "none";
    }
}

function updateContent() {
    var i;
	var infoCards = [];
    
    for (i = 0; i < info.length; i += 1) {
        infoCards.push(createInfoCard(info[i]));
    }
	
    while (infoContent.firstChild) {
		infoContent.removeChild(infoContent.firstChild);
	}
	
    for (i = 0; i < infoCards.length; i += 1) {
		if (infoCards[i]) {
			infoContent.appendChild(infoCards[i]);
		}
    }
    
    filterContent();
    updateUI();
}


function onFollowedModeToggle() {
    requests.send("settingsUpdate", {prop: "interFollowedMode", val: !settings.interFollowedMode});
}

function onChannelsMode() {
    requests.send("settingsUpdate", {prop: "interMode", val: "channels"});
}

function onGamesMode() {
    requests.send("settingsUpdate", {prop: "interMode", val: "games"});
}

function onVideosMode() {
    requests.send("settingsUpdate", {prop: "interMode", val: "videos"});
}

function onFollowsTab() {
    settingsTab = "follows";
	updateUI();
}

function onAlarmTab() {
    settingsTab = "alarm";
	updateUI();
}

function onInterfaceTab() {
    settingsTab = "interface";
	updateUI();
}

function onAboutTab() {
    settingsTab = "about";
	updateUI();
}

function onSettingsModeToggle() {
	if (!settingsMode) {
		preSettingsScrollY = window.scrollY;
	}
    requests.send("toggleSettingsMode");
}

function onHidePreview() {
    previewContent.className = "screenLock";
    enlargedPreview.style.backgroundImage = '';
}

function onRefresh() {
    info = [];
    updateContent();
    window.scrollTo(0, 0);
    requests.send("infoUpdate", "refresh");
}

function onMuteToggle() {
    requests.send("settingsUpdate", {prop: "alarmSound", val: !settings.alarmSound});
}

function onRightButton() {
	if (document.getElementById("rightButton").className === "menuButton home") {
		requests.send("endSearch");
	} else {
    var newSortMethod;
		switch (settings.interSortMethod) {
			case "viewers":
				newSortMethod = "recent";
				break;
			case "recent":
				newSortMethod = "alphabetical";
				break;
			case "alphabetical":
				newSortMethod = "viewers";
				break;
		}
		requests.send("settingsUpdate", {prop: "interSortMethod", val: newSortMethod});
	}
}

function onSearchInput() {
    updateUI();
    filterContent();
}

function onSearch() {
    if (settings.interFollowedMode || settings.interMode === "videos" || searchHistory.length) {
        return;
    }
    requests.send("searchTwitch", {target: searchBox.value, scrollY: window.scrollY, prompt: prompt});
}

function onAdd() {
	var terms = searchBox.value.replace(/\s/g, '').split(",");
	if (terms.length) {
		searchBox.value = "";
		updateUI();
		document.getElementById("addButton").className = "menuButton refresh thinking";
		requests.send("followChannels", terms);
	}
}

function onRemove() {
	var terms = getSelectValues(followList);
	if (terms.length) {
		document.getElementById("removeButton").className = "menuButton refresh thinking";
		requests.send("unfollowChannels", terms);
	}
}

document.onkeydown = function (ev) {
    if (ev.keyCode === 46 && settingsMode && settingsTab === "follows") {
        onRemove();
    }
};

function onSearchKeyDown(ev) {
    if (ev.keyCode === 13) {
		if (document.getElementById("searchButton").style.display !== "none") {
			onSearch();
		}
		if (document.getElementById("addButton").style.display !== "none") {
			onAdd();
		}
    }
}

function onSearchBack() {
    requests.send("searchBack");
}

function onLeftTab() {
    if (document.getElementById("leftSearchTab").className !== "tabElement selected") {
        requests.send("searchBack");
		if (document.getElementById("rightTabButton").className === "tabButton channels") {
			requests.send("searchTwitch", {target: searchHistory[searchHistory.length - 1].target, scrollY: window.scrollY, prompt: prompt});
		} else {
			requests.send("searchDirectory", {type: "getHighlights", target: searchHistory[searchHistory.length - 1].target, scrollY: window.scrollY, prompt: prompt});
		}
    }
}

function onRightTab() {
    if (document.getElementById("rightSearchTab").className !== "tabElement selected") {
        requests.send("searchBack");
		if (document.getElementById("rightTabButton").className === "tabButton channels") {
			requests.send("searchTwitch", {type: "streams", target: searchHistory[searchHistory.length - 1].target, scrollY: window.scrollY, prompt: prompt});
		} else {
			requests.send("searchDirectory", {type: "getBroadcasts", target: searchHistory[searchHistory.length - 1].target, scrollY: window.scrollY, prompt: prompt});
		}
    }
}

function onClosePrompt(ev) {
    if (ev.target.className === "promptExit" || ev.target.className === "screenLock selected") {
        document.getElementById("clickPrompt").className = "screenLock";
        prompt = new Prompt();
    }
}

function onFollowUnfollow() {
    switch (prompt.type) {
        case "channel":
            requests.send(document.getElementById("promptFollow").className === "promptFollow" ? "followChannel" : "unfollowChannel", prompt.name);
            break;
        case "game":
            requests.send(document.getElementById("promptFollow").className === "promptFollow" ? "followGame" : "unfollowGame", prompt.name);
            break;
    }
}

function onMuteUnmute() {
    switch (prompt.type) {
        case "channel":
            requests.send(document.getElementById("promptMute").className === "promptMute" ? "muteChannel" : "unmuteChannel", prompt.name);
            break;
        case "game":
            requests.send(document.getElementById("promptMute").className === "promptMute" ? "muteGame" : "unmuteGame", prompt.name);
            break;
    }
}

function onLoginLogout() {
	if (settings.followedAuthInfo.token) {
		requests.send("logout");
	} else {
		requests.send("login");
	}
    
}

function onSettingsDownload() {
    var textToWrite = JSON.stringify(settings);
    var textFileAsBlob = new Blob([textToWrite], {
        type: 'text/plain'
    });
    var fileNameToSaveAs = "Twitch_Fox_" + new Date().toJSON().slice(0, 10) + ".txt";
    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.textContent = "Save settings";
    downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
}

document.getElementById("uploadButton").onchange = function() {
    var file = this.files[0];
    var reader = new FileReader();
    reader.onload = function () {
        requests.send("importSettings", JSON.parse(this.result));
    };
    reader.readAsText(file);
};

function onOpenVideos() {
    document.getElementById("clickPrompt").className = "screenLock";
    
	if (settingsMode) {
		settingsMode = false;
		updateUI();
	}
	
	if (prompt.type === "game") {
		requests.send("searchDirectory", {type: "getGameVideos", target: prompt.name, scrollY: window.scrollY, prompt: prompt});
	} else {
		requests.send("searchDirectory", {type: "getHighlights", target: prompt.name, scrollY: window.scrollY, prompt: prompt});
	}
}

function onOpenGameDirectory() {
    document.getElementById("clickPrompt").className = "screenLock";
    
	if (settingsMode) {
		settingsMode = false;
		updateUI();
	}
	
	requests.send("searchDirectory", {type: "getGameStreams", target: prompt.name, scrollY: window.scrollY, prompt: prompt});
}

function onMuteToggle() {
    requests.send("settingsUpdate", {prop: "alarmSound", val: !settings.alarmSound});
}

function onOpenTwitchPage() {
    requests.send("openTab", prompt.url);
}

function onOpenLivestreamer(ev) {
    if (ev.target.id !== "qualitySelect") {
        if (document.getElementById("qualitySelect").style.display === "inline") {
            requests.send("openLive", {url: prompt.url, quality: document.getElementById("qualitySelect").value});
            requests.send("settingsUpdate", {prop: "interLivestreamerQuality", val: document.getElementById("qualitySelect").value});
        } else {
            requests.send("getQualities", prompt.url);
            document.getElementById("liveStreamSpan").style.display = "none";
            document.getElementById("liveVideoSpan").style.display = "none";
            document.getElementById("qualityError").style.display = "none";
            document.getElementById("qualityFinding").style.display = "inline";
        }
    }
}

function onOpenVideoPopout() {
    window.open("http://www.twitch.tv/" + prompt.name + "/popout?videoId=" + prompt._id,'_blank','right=50,top=50,width=630,height=381,resizable=yes,scrollbars=no,toolbar=no,location=no,directories=no,status=no,menubar=no,copyhistory=no');
}

function onBoolSetting(ev) {
    requests.send("settingsUpdate", {prop: ev.target.id, val: ev.target.checked, alarmUpdate: ev.target.id === "alarmRestrict" || ev.target.id === "alarmSound" || ev.target.id === "alarmDisableIconFlashing"});
}

function onImportFollows() {
    requests.send("importFollows", document.getElementById("importFollows").value);
	document.getElementById("importFollows").value = "";
	document.getElementById("importButton").className = "menuButton refresh thinking";
}

function onImportKeyDown(ev) {
    if (ev.keyCode === 13) {
		onImportFollows();
    }
}

function onClearFollows() {
	requests.send("clearFollows");
}

function onAlarmDefaults() {
	requests.send("alarmDefaults");
}

function onInterfaceDefaults() {
	requests.send("interfaceDefaults");
}

function onFollowListChange() {
	if (followList.selectedIndex < 0) {
		document.getElementById("addButton").style.display = "inline-block";
		document.getElementById("removeButton").style.display = "none";
	} else {
		document.getElementById("removeButton").style.display = "inline-block";
		document.getElementById("addButton").style.display = "none";
	}
}

function onFollowListMute(ev) {
	if (ev.target.nodeName !== "OPTION") {
		followList.selectedIndex = -1;
		document.getElementById("removeButton").style.display = "none";
		document.getElementById("addButton").style.display = "inline-block";
	} else {
		if (followList.selectedIndex < 0) {
			updateUI();
		} else {
			var muted = followList.children[followList.selectedIndex].className === "offline";
			var terms = getSelectValues(followList);
			requests.send(muted ? "unmuteChannels" : "muteChannels", terms);
		}
	}
}

function onFollowListClick(ev) {
	if (ev.target.nodeName !== "OPTION") {
		followList.selectedIndex = -1;
		document.getElementById("removeButton").style.display = "none";
		document.getElementById("addButton").style.display = "inline-block";
	}
}

window.onscroll = function() {
    if (infoContent.clientHeight - window.scrollY <= window.innerHeight - 64 && (searchHistory.length || !settings.interFollowedMode || settings.interMode === "videos") && !settingsMode) {
        //onBottomOfPage
        requests.send("infoUpdate", "scroll");
    }
};

document.getElementById("alarmUpdate").onchange = function() {
	if (Number(this.value) < 60) {
		this.value = 60;
	}
	requests.send("settingsUpdate", {prop: this.id, val: Number(this.value)});
};

document.getElementById("alarmInterval").onchange = function() {
	if (Number(this.value) < 1) {
		this.value = 1;
	}
	requests.send("settingsUpdate", {prop: this.id, val: Number(this.value), alarmUpdate: true});
};

document.getElementById("alarmVolume").onchange = function() {
	if (Number(this.value) < 0) {
		this.value = 0;
	} else if (Number(this.value) > 100) {
		this.value = 100;
	}
	requests.send("settingsUpdate", {prop: this.id, val: Number(this.value), alarmUpdate: true});
};

restrictChange = function() {
	var hh = Number(this.value.slice(0,2));
	var mm = Number(this.value.slice(3,5));
	var ss = Number(this.value.slice(6,8));
	if (isNaN(hh)) {
		hh = 12;
	}
	if (hh > 24) {
		hh = 24;
	}
	if (isNaN(mm)) {
		mm = 0;
	}
	if (mm > 59) {
		mm = 59;
	}
	if (isNaN(ss)) {
		ss = 0;
	}
	if (ss > 59) {
		ss = 59;
	}
	if (hh < 10) {
		hh = "0" + hh;
	}
	if (mm < 10) {
		mm = "0" + mm;
	}
	if (ss < 10) {
		ss = "0" + ss;
	}
	requests.send("settingsUpdate", {prop: this.id, val: hh + ":" + mm + ":" + ss, alarmUpdate: true});
};

document.getElementById("alarmRestrictFrom").onchange = restrictChange;
document.getElementById("alarmRestrictTo").onchange = restrictChange;

document.getElementById("alarmPath").onchange = function() {
	requests.send("settingsUpdate", {prop: this.id, val: this.value, alarmUpdate: true});
};

document.getElementById("alarmLength").onchange = function() {
	if (Number(this.value) < 1) {
		this.value = 1;
	}
	requests.send("settingsUpdate", {prop: this.id, val: Number(this.value)});
};

document.getElementById("interSearchLim").onchange = function() {
	if (Number(this.value) < 12) {
		this.value = 12;
	} else if (Number(this.value) > 100) {
		this.value = 100;
	}
	requests.send("settingsUpdate", {prop: this.id, val: Number(this.value)});
};

document.getElementById("interLivestreamerPath").onchange = function() {
	document.getElementById("livestreamerStatus").className = "bold";
	document.getElementById("livestreamerStatus").textContent = l10n.searching;
	requests.send("newLivePath", this.value);
};

document.getElementById("interLivestreamerQuality").onchange = function() {
	requests.send("settingsUpdate", {prop: this.id, val: this.value});
};

//Ports below here

addon.port.on("forcePrompt", function(payload) {
    if (prompt.type !== payload.type && prompt.name !== payload.name) {
		prompt = new Prompt();
		switch (payload.type) {
			case "channel":
                prompt.type = payload.type;
                prompt.name = payload.name;
                prompt.url = payload.name;
                prompt.display_name = payload.display_name;
                prompt.online = payload.online;
                prompt.cause = searchHistory.length && searchHistory[searchHistory.length - 1].type || settings.interMode;

                createPrompt();
				break;
			case "game":
                prompt.type = "game";
                prompt.name = payload.name;
                prompt.url = "directory/game/" + payload.name;
                prompt.display_name = payload.name;
                prompt.online = true;
                prompt.cause = searchHistory.length && searchHistory[searchHistory.length - 1].type || settings.interMode;

                createPrompt();
				break;
		}
	}
});

addon.port.on("infoUpdate", function(payload) {
    requests.remove("infoUpdate");
    
	onlineChannels = payload.onlineChanLen;
	onlineGames = payload.onlineGameLen;

    info = payload.info;
    searchHistory = payload.searchHistory;
	if (!settingsMode) {
		updateContent();
	}
});

addon.port.on("openTab", function() {
    requests.remove("openTab");
});

addon.port.on("login", function() {
    requests.remove("login");
});

addon.port.on("logout", function() {
    requests.remove("logout");
});

addon.port.on("getQualities", function(payload) {
    requests.remove("getQualities");
    
    while (document.getElementById("qualitySelect").firstChild) {
        document.getElementById("qualitySelect").removeChild(document.getElementById("qualitySelect").firstChild);
    }  
    
    for (var i = 0; i < payload.length; i += 1) {
        var newOption = document.createElement("option");
        newOption.value = payload[i];
        newOption.textContent = payload[i];
        if (payload[i] === settings.interLivestreamerQuality) {
            newOption.selected = true;
        }
        document.getElementById("qualitySelect").appendChild(newOption);
    }
    
    document.getElementById("qualityFinding").style.display = "none";
    if (payload.length) {
        document.getElementById("qualitySpan").style.display = "inline";
        document.getElementById("qualitySelect").style.display = "inline";
    } else {
        document.getElementById("qualityError").style.display = "inline";
    }
});

addon.port.on("openLive", function() {
    requests.remove("openLive");
	requests.remove("openLiveUncertain");
});

addon.port.on("toggleSettingsMode", function(payload) {
    requests.remove("toggleSettingsMode");
	settingsMode = payload;

	searchBox.value = "";
	updateContent();
	if (!settingsMode) {
		window.scrollTo(0, preSettingsScrollY);
	}
});

addon.port.on("searchTwitch", function(payload) {
    requests.remove("searchTwitch");
    var oldHistoryLen = searchHistory.length;
    searchHistory = payload;
    if (searchHistory.length && !oldHistoryLen) {
        preSearchInfo = info;
        preSearchScrollY = window.scrollY;
		preSearchPrompt = prompt;
    }
    searchBox.value = "";
    info = [];
	requests.send("infoUpdate");
    updateContent();
});

addon.port.on("searchDirectory", function(payload) {
    requests.remove("searchDirectory");
    var oldHistoryLen = searchHistory.length;
    searchHistory = payload;
    if (searchHistory.length && !oldHistoryLen) {
        preSearchInfo = info;
        preSearchScrollY = window.scrollY;
		preSearchPrompt = prompt;
    }
    searchBox.value = "";
    info = [];
	requests.send("infoUpdate");
    updateContent();
});

addon.port.on("searchBack", function(payload) {
    requests.remove("searchBack");
    searchHistory = payload;
    if (searchHistory.length) {
        info = searchHistory[searchHistory.length - 1].result;
		prompt = searchHistory[searchHistory.length - 1].prompt;
		//if (prompt.type && prompt.cause === (searchHistory.length && searchHistory[searchHistory.length - 1].type || settings.interMode))
		if (prompt && prompt.type) {
			createPrompt();
		}
        updateContent();
        window.scrollTo(0, searchHistory[searchHistory.length - 1].scrollY);
    } else {
        info = preSearchInfo;
		prompt = preSearchPrompt;
		//if (prompt.type && prompt.cause === (searchHistory.length && searchHistory[searchHistory.length - 1].type || settings.interMode))
		if (prompt.type) {
			createPrompt();
		}
        updateContent();
        window.scrollTo(0, preSearchScrollY);
    }
    searchBox.value = "";
    onSearchInput();
});

addon.port.on("endSearch", function(payload) {
    requests.remove("endSearch");
    searchHistory = payload;
	info = preSearchInfo;
	prompt = new Prompt();
	updateContent();
	window.scrollTo(0, preSearchScrollY);
    searchBox.value = "";
    onSearchInput();
});

addon.port.on("livestreamerReady", function(payload) {
    requests.remove("livestreamerReady");
    livestreamerReady = payload;
});

addon.port.on("l10n", function(payload) {
    l10n = payload;
	
	document.getElementById("versionCounter").textContent = l10n.version;
	document.getElementById("versionSpan").textContent = l10n.version;
	document.getElementById("alarmPath").placeholder = l10n.custom2;
	document.getElementById("interLivestreamerPath").placeholder = l10n.leaveBlank;
	document.getElementById("importFollows").placeholder = l10n.importFollowed;
});

addon.port.on("settingsUpdate", function(payload) {
    requests.remove("settingsUpdate");
	requests.remove("alarmDefaults");
	requests.remove("alarmUpdate");
	requests.remove("clearFollows");
	requests.remove("followChannel");
	requests.remove("followChannels");
	requests.remove("followGame");
	requests.remove("importFollows");
	requests.remove("importSettings");
	requests.remove("interfaceDefaults");
	requests.remove("muteChannel");
	requests.remove("muteChannels");
	requests.remove("muteGame");
	requests.remove("newLivePath");
	requests.remove("unfollowChannel");
	requests.remove("unfollowChannels");
	requests.remove("unfollowGame");
	requests.remove("unmuteChannel");
	requests.remove("unmuteChannels");
	requests.remove("unmuteGame");
	
    var oldSettings = settings;
    settings = payload;
    oldSettings = oldSettings || settings;
    
    if (oldSettings.interMode !== settings.interMode || oldSettings.interFollowedMode !== settings.interFollowedMode) {
		info = [];
		window.scrollTo(0, 0);
		requests.send("infoUpdate", !settings.interFollowedMode && "refresh");
    }
    
    if (oldSettings.interSortMethod !== settings.interSortMethod) {
        requests.send("infoUpdate", "sort");
    }
	
	if (!settingsMode && prompt && prompt.type) {
		createPrompt();
	}
	
    updateUI();
    filterContent();
});

//Let's tell the add-on we're ready to receive stuff

addon.port.emit("panelReady");