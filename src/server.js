import http from "http";
// import WebSocket from "ws";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));


const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

function publicRooms() {
    const {
        sockets: {
            adapter: { sids, rooms },
        },
    } = wsServer;
    const publicRooms = [];
    rooms.forEach((_, key) => { // 신경쓰지 않을 요소는 _로 적나봄!
        if(sids.get(key) === undefined) { // true면 Public room을 찾은것이다.
            publicRooms.push(key);
        }
    }) 
    return publicRooms;
}

function countRoom(roomName) {
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
    socket["nickname"] = "Anon";
    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`);
    });
    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName);
        done();
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName)); // welcome 이벤트를 roomName에 있는 모든사람에게 emit 함
        wsServer.sockets.emit("room_change", publicRooms());// 누군가 방에 들어오면 모두에게 방이 변경됨을 알려줄것
    });
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => socket.to(room).emit("bye", socket.nickname, countRoom(room)-1 ));
        });
    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());// 누군가 방을 떠나면 모두에게 방이 변경됨을 알려줄것
    });
    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    });
    socket.on("nickname", nickname => (socket["nickname"] = nickname)); // socket에 닉네임 저장하기.
});





// const wss = new WebSocket.Server({ server }); 

// socket
// const sockets = [];
//
// wss.on("connection", (socket) => {
//     sockets.push(socket);
//     socket["nickname"] = "Anon"// 익명 유저들을 위해 익명을줌
//     console.log("Connected to Browser ✅");
//     socket.on("close", () => console.log("Disconnected from Server ❌"));
//     socket.on("message", (msg) => {
//         const message = JSON.parse(msg);
//         switch(message.type) {
//             case "new_message":
//                 sockets.forEach(aSocket => aSocket.send(`${socket.nickname}: ${message.payload}`));
//             case "nickname":
//                 socket["nickname"] = message.payload; // socket은 기본적으로 객체이기에 item을 추가할 수 있따
//                 console.log(message.payload);
//         }
//     });
// });


const handleListen = () => console.log(`Listeing on http://localhost:3000`);
httpServer.listen(3000, handleListen);