// sharedworker is the hub between the server all opened chat tabs.
// sharedworker sends data to chat app using a broadcastChannel API, where all tabs will receive the data
// sharedworder sends data to the server using socket.io (the way to import socket.io for this file is importScripts("https://cdn.socket.io/4.5.3/socket.io.min.js");)


const fileManagerBroadcast = new BroadcastChannel("WebSocketChannel");
fileManagerBroadcast.postMessage({ type: "testing broadcast" })

const allPorts = [];

onconnect = function(e) {
    
    // the incoming port
    var port = e.ports[0];
    allPorts.push(port);

  // =============== worker and broadcast messages ==================
  port.addEventListener('message', function(e) {
    const message = e.data;

    if (message.type === "token") {  
      const JWT = e.data.token
      fileManagerBroadcast.postMessage({ type: "connected" })

      importScripts("https://cdn.socket.io/4.5.3/socket.io.min.js");
      const socket = io.connect("localhost:4000", {
        transports: ["websocket"],
        auth: {
          token: JWT,
        },
      })

      socket.on("connected", () => {
        socket.emit("join");
      });

      socket.on("uploads", (message) => {
        fileManagerBroadcast.postMessage({type : "uploads", content: message})
      });

      socket.on("folders", (message) => {
        fileManagerBroadcast.postMessage({type : "folders", content: message})
      });

      socket.on("notification", (message) => {
        fileManagerBroadcast.postMessage({type : "notification", content: message})
      });

      socket.on("keys_redis", (message) => {
        fileManagerBroadcast.postMessage({type : "keys_redis", content: message})
      });
    }

    if (message.type === "end") {
      socket.emit("end")
    }
  });

  port.start(); 
}

