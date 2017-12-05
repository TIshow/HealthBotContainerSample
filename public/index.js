function requestChatBot(location) {
    // remove current chatbot if exists
    const botContainer = document.getElementById('botContainer');
    if (botContainer.childNodes.length > 0) {
        botContainer.removeChild(botContainer.childNodes[0]);
    }
    botContainer.classList.remove("wc-display");

    const oReq = new XMLHttpRequest();
    oReq.addEventListener("load", initBotConversation);
    var path = "/chatBot";
    if (location) {
        path += "?lat=" + location.lat + "&long=" + location.long;
    }
    oReq.open("GET", path);
    oReq.send();
}

function getUserLocation(callback) {
    navigator.geolocation.getCurrentPosition(
        function(position) {
            var latitude  = position.coords.latitude;
            var longitude = position.coords.longitude;
            var location = {
                lat: latitude,
                long: longitude
            }
            callback(location);
        },
        function(error) {
            // user declined to share location
            console.log("location error:" + error.message);
            callback();
        });
}

function sendUserLocation(botConnection, user) {
    getUserLocation(function (location) {
        botConnection.postActivity({type: "message", text: JSON.stringify(location), from: user}).subscribe(function (id) {console.log("success")});
    });
}

function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}

function initBotConversation() {
    if (this.status >= 400) {
        alert(this.statusText);
        return;
    }
    // extract the data from the JWT
    const jsonWebToken = this.response;
    const tokenPayload = JSON.parse(atob(jsonWebToken.split('.')[1]));
    const user = {
        id: getCookie("userid"),
        name: "you"
    };
    const botConnection = new BotChat.DirectLine({
        //secret: botSecret,
        token: tokenPayload.connectorToken,
        //domain: "",
        webSocket: true
    });
    botConnection.postActivity({type: "event", value: jsonWebToken, from: user, name: "InitAuthenticatedConversation"}).subscribe(function (id) {startChat(user, botConnection)});
    botConnection.activity$
        .filter(function (activity) {return activity.type === "event" && activity.name === "shareLocation"})
        .subscribe(function (activity) {sendUserLocation(botConnection, user)});

}

function startChat(user, botConnection) {
    const botContainer = document.getElementById('botContainer');
    botContainer.classList.add("wc-display");

    BotChat.App({
        botConnection: botConnection,
        user: user,
        locale: 'en',
        resize: 'detect'
        // sendTyping: true,    // defaults to false. set to true to send 'typing' activities to bot (and other users) when user is typing
    }, botContainer);
}