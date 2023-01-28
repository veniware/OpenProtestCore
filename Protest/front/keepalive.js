const isSecure = window.location.href.toLowerCase().startsWith("https://");

const KEEP = {
    socket: null,
    version: "0",
    username: "",

    Initialize: ()=> {
        let server = window.location.href;
        server = server.replace("https://", "");
        server = server.replace("http://", "");
        if (server.endsWith("/")) server = server.substring(0, server.indexOf("/"));
        
        KEEP.socket = new WebSocket((isSecure ? "wss://" : "ws://") + server + "/ws/keepalive");

        KEEP.socket.onopen = ()=> {
            KEEP.socket.send("hi from client");
        };

        KEEP.socket.onclose = ()=> {
        };

        KEEP.socket.onmessage = event => {
            let json = JSON.parse(event.data);
            KEEP.MessageHandler(json);
        };

        KEEP.socket.onerror = ()=> { };
    },

    MessageHandler: msg=> {
        const action = msg.action;

        switch (action) {
            case "init":
                KEEP.version = msg.version;
                KEEP.username = msg.username;
                lblUsername.textContent = KEEP.username;

                break;

            case "log":
                WIN.array.filter(win => win instanceof Log).forEach(log => log.Add(msg.msg));
                break;

            case "forcereload":
                location.reload();
                break;

            case "updatedevice":
                break;

            case "updateuser":
                break;

            case "deleteuser":
                break;

            case "deleteuser":
                break;

            default:
                console.log("none register action: " + msg);
                break;
        }

    },

    SendAction: action=> {
        if (KEEP.socket === null || KEEP.socket.readyState !== 1) return;
        KEEP.socket.send(action);
    },

    Notification: msg=> {

    }

};