const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);
// const io = Socket(http);
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname + "/public"));

io.on("connection", (socket) => {
  // console.log("connected");
  // socket.join("javascipt");
  // console.log(io.sockets.adapter.rooms);
  // console.log("socket.id", socket.id);

  socket.on("create_or_join", (data) => {
    const { room, userId } = data;
    const roomsArr = [...io.sockets.adapter.rooms];
    const rooms = roomsArr.find((roomArr) => roomArr[0] === room) || [
      room,
      new Set(),
    ];
    let roomSize = rooms[1].size;
    if (roomSize === 0) {
      socket.join(room);
      io.to(socket.id).emit("created", data);
    } else if (roomSize === 1) {
      socket.join(room);
      socket.broadcast.emit("connected", data);
      socket.to(room).emit("connected", data);
      io.to(socket.id).emit("joined", data);
    } else if (roomSize > 1) {
      io.to(socket.id).emit("room_full", room + " room is Full try later");
    }
    socket.on("disconnect", () => {
      socket.broadcast.emit("disconnected", data);
      socket.to(room).emit("disconnected", data);

      socket.leave(room);
    });
  });
});

server.listen(PORT, () => {
  console.log("App is runing in port :", PORT);
});
