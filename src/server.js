//- VIDEO CALL
import http from "http";
import {Server} from "socket.io";
import {instrument} from "@socket.io/admin-ui";
import express from "express";
import path from "path"
const __dirname = path.resolve();

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/src/views");
app.use("/public", express.static(__dirname + "/src/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true,
    },
});

wsServer.on("connection", socket =>{
    socket.on("join_room", (roomName) => {
        socket.join(roomName);
        socket.to(roomName).emit("welcome");
    });
    socket.on("offer", (offer, roomName) =>{
        socket.to(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    });
});

const handleListen = () => console.log(`listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);




//- //- SOCKETIO CHAT
// import http from "http";
// import {Server} from "socket.io";
// import {instrument} from "@socket.io/admin-ui";
// import express from "express";
// import path from "path"
// const __dirname = path.resolve();

// const app = express();

// app.set("view engine", "pug");
// app.set("views", __dirname + "/src/views");
// app.use("/public", express.static(__dirname + "/src/public"));
// app.get("/", (req, res) => res.render("home"));
// app.get("/*", (req, res) => res.redirect("/"));


// const handleListen = () => console.log(`listening on http://localhost:3000`);


// const httpServer = http.createServer(app);
// const wsServer = new Server(httpServer, {
//     cors: {
//         origin: ["https://admin.socket.io"],
//         credentials: true,
//     },
// });

// instrument(wsServer, {
//     auth: false,
// });

// function publicRooms(){
//     const {sockets: {adapter: {sids, rooms}}} = wsServer;
//     // const sids = wsServer.sockets.adapter.sids;
//     // const rooms = wsServer.sockets.adapter.rooms;

//     const publicRooms = [];
//     rooms.forEach((_,key) => {
//         if(sids.get(key) === undefined){
//             publicRooms.push(key)
//         }
//     });
//     return publicRooms;
// }

// function countRoomSize(roomName){
//     return wsServer.sockets.adapter.rooms.get(roomName)?.size;
// }


// wsServer.on("connection", (socket) => {

//     wsServer.sockets.emit("room_list_update", publicRooms())

//     socket["nickname"] = "Anonymous";

//     socket.onAny((event) => {
//         console.log(`Socket Event:${event}`);
//     });

//     socket.on("enter_room", (roomName, nickname, showRoom) => {
//         socket["nickname"] = nickname;
//         socket.join(roomName);
//         showRoom(countRoomSize(roomName));
//         socket.to(roomName).emit("welcome", socket.nickname, countRoomSize(roomName));
//         wsServer.sockets.emit("room_list_update", publicRooms())
//     });

//     socket.on("disconnecting", () =>{
//         socket.rooms.forEach(room => 
//             socket.to(room).emit("bye", socket.nickname, countRoomSize(room)-1)
//         );
//     });
    
//     socket.on("disconnect", () =>{
//         wsServer.sockets.emit("room_list_update", publicRooms())        
//     })

//     socket.on("new_message", (msg, room, done) =>{
//         socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
//         done();
//     })

// });






///////////Websocket way///////////
// import {WebSocketServer} from "ws"

// const wss = new WebSocketServer({ server })
// const sockets = []

// wss.on("connection", (socket) =>{
//     sockets.push(socket)
//     socket["nickname"] = "Anonymous"
//     console.log("Connected to Browser ✅")

//     socket.on("close", () => {
//         console.log("Disconnected from Browser ❌")
//     })
    
//     socket.on("message", (msg) =>{
//         const message = JSON.parse(msg)
//         switch(message.type){
//             case "new_message":
//                 const messageString = message.payload.toString('utf-8')
//                 sockets.forEach(aSocket => aSocket.send(`${socket.nickname}: ${messageString}`))
//                 break
//             case "nickname":
//                 socket["nickname"] = message.payload
//                 break
//         }       

//     })
// })


// httpServer.listen(3000, handleListen)