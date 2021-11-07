const express = require("express");
const Socket = require("socket.io");
const http = require("http");

const app = express();

const server = http.Server(app);
const io = Socket(server);

const PORT = process.env.PORT || 3000;

let peersConnection = [];

app.use(express.static(__dirname + "/public"));

io.on("connection", (socket) => {
  peersConnection.push(socket.id);
  console.log(peersConnection);
  socket.on("disconnect", disConnect.bind(null, socket));
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

server.listen(PORT, () => console.log("server runing in port 3000"));

function disConnect(socket) {
  peersConnection = peersConnection.filter((id) => id !== socket.id);
}
