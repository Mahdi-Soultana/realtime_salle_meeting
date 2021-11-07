const socket = io("/");
// const socket = new WebSocket("ws://localhost:3000");
const form = document.querySelector("form");
const submitBtn = document.querySelector("form button[type='submit']");
const rooms = document.querySelector(".rooms");
const roomInput = document.querySelector(".room");
const local = document.querySelector(".local");
const remote = document.querySelector(".remote");
const connectIcons = document.querySelectorAll("form span");
const iceServers = {
  config: {
    iceServers: [
      { urls: "stun:stun.services.mozilla.com" },
      { urls: "stun:stun.l.google.com:19302" },
    ],
  },
};

const peer = new Peer(iceServers);
let roomName, localStream, remoteStream, isCreated, peerId, status;
submitBtn.disabled = true;

peer.on("open", function (id) {
  peerId = id;
  console.log("My peer ID is: " + id);
  submitBtn.disabled = false;
  console.log(submitBtn);
});

const streamConstraints = {
  audio: true,
  video: true,
};

// execution

connectIcons[1].style.display = "none";

///socket client Init

window.addEventListener("DOMContentLoaded", () => {
  roomInput.focus();
});
///

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const roomValue = roomInput.value.trim();
  if (!roomValue) {
    return alert("please enter your room meeting");
  }
  if (peerId) {
    socket.emit("create_or_join", { userId: peerId, room: roomValue });
    submitBtn.disabled = false;
  }
});

//fn

function enableLocalStream() {
  navigator.mediaDevices
    .getUserMedia(streamConstraints)
    .then((localStreamRes) => {
      localStream = localStreamRes;
      local.children[0].srcObject = localStream;
    })
    .catch((e) => {
      console.log("Opps error while connecting please do something !", e);
    });
}

function onAddStream(stream) {
  remoteStream = stream;
  remote.children[0].srcObject = stream;
}

function endCall() {
  let remoteVideo = remote.children[0].srcObject;
  let localVideo = local.children[0].srcObject;

  remoteVideo.getTracks().forEach((track) => {
    track.stop();
  });
  localVideo.getTracks().forEach((track) => {
    track.stop();
  });

  remote.children[0].srcObject = null;
  local.children[0].srcObject = null;
}
//listiners sockets
socket.on("created", (data) => {
  enableLocalStream();
  isCreated = true;
  roomName = data.room;
});
//listiners sockets
socket.on("joined", (data) => {
  enableLocalStream();
  roomName = data.room;
});
socket.on("connected", (data) => {
  var call = peer.call(data.userId, localStream);
  status = true;
  checkActive();
  call.on("stream", function (stream) {
    onAddStream(stream);
  });
});

peer.on("call", function (call) {
  call.answer(localStream);
  call.on("stream", function (stream) {
    status = true;
    checkActive();
    onAddStream(stream);
  });
});

socket.on("disconnected", () => {
  status = false;
  checkActive();
  peer.disconnect();
});
peer.on("disconnected", function () {
  alert("your Friend is Ended The Call ! ");
  peer.disconnect();
  peer.destroy();
  endCall();
  document.location.reload(true);
});

window.onbeforeunload = function () {
  status = false;
  checkActive();
  e.preventDefault();
  alert("You are now leaving, are you sure?");
  peer.disconnect();
  peer.destroy();
  e.returnValue = "";
};

function checkActive() {
  if (status) {
    connectIcons[1].style.display = "inline";
    connectIcons[0].style.display = "none";
  } else {
    connectIcons[0].style.display = "inline";
    connectIcons[1].style.display = "none";
  }
}
