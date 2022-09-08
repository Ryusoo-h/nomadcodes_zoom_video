import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listeing on http://localhost:3000`);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server }); 

const sockets = [];

wss.on("connection", (socket) => {
    sockets.push(socket);
    socket["nickname"] = "Anon"// 익명 유저들을 위해 익명을줌
    console.log("Connected to Browser ✅");
    socket.on("close", () => console.log("Disconnected from Server ❌"));
    socket.on("message", (msg) => {
        const message = JSON.parse(msg);
        switch(message.type) {
            case "new_message":
                sockets.forEach(aSocket => aSocket.send(`${socket.nickname}: ${message.payload}`));
            case "nickname":
                socket["nickname"] = message.payload; // socket은 기본적으로 객체이기에 item을 추가할 수 있따
                console.log(message.payload);
        }
    });
});



server.listen(3000, handleListen);