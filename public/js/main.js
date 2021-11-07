const socket = io("/");
// const socket = new WebSocket("ws://localhost:3000");
const form = document.querySelector("form");
const submitBtn = document.querySelector("form button[type='submit']");
const rooms = document.querySelector(".rooms");
const roomInput = document.querySelector(".room");
const local = document.querySelector(".local");
const remote = document.querySelector(".remote");
const connectIcons = document.querySelectorAll("form span");

let roomName, localStream, remoteStream, rtcPeerConnection, isCreated;

const iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

const streamConstraints = {
  audio: true,
  video: true,
};

// execution

connectIcons[1].style.display = "none";

///socket client Init

socket.on("connect", () => {
  console.log("connect");
});

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
  socket.emit("create_or_join", { userId: socket.id, room: roomValue });
});

//fn

function enableLocalStream() {
  navigator.mediaDevices
    .getUserMedia(streamConstraints)
    .then((localStreamRes) => {
      localStream = localStreamRes;
      console.dir(localStream);
      local.children[0].srcObject = localStream;
    })
    .catch((e) => {
      console.log("Opps error while connecting please do something !", e);
    });
}

function onAddStream(event) {
  console.log(event);
  remoteStream = event.streams[0];
  remote.children[0].srcObject = event.streams[0];
}

//listiners sockets
socket.on("created", (data) => {
  enableLocalStream();
  console.log("created");
  isCreated = true;
  roomName = data.room;
});
socket.on("joined", (data) => {
  console.log("joined");
  enableLocalStream();
  setTimeout(() => {
    socket.emit("ready", data);
  }, 1000);
});

socket.on("room_full", (msg) => {
  console.log(msg);
});
socket.on("ready", (data) => {
  if (isCreated) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCondidat;
    rtcPeerConnection.ontrack = onAddStream;

    ///
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
    rtcPeerConnection
      .createOffer()
      .then((sessionDescription) => {
        rtcPeerConnection.setLocalDescription(sessionDescription);
        socket.emit("offer", {
          type: "offer",
          sdp: sessionDescription,
          room: roomName,
        });
      })
      .catch((e) => {
        console.log("error while creating offer");
      });
  }
});

///response from responder$$

socket.on("offer", (sdp) => {
  console.log(localStream.getTracks());
  if (!isCreated) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCondidat;
    rtcPeerConnection.ontrack = onAddStream;

    ///
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    rtcPeerConnection
      .createAnswer()
      .then((sessionDescription) => {
        rtcPeerConnection.setLocalDescription(sessionDescription);
        socket.emit("answer", {
          type: "answer",
          sdp: sessionDescription,
          room: roomName,
        });
      })
      .catch((e) => {
        console.log("error while creating answer");
      });
  }
});

socket.on("answer", (sdp = responderSdp) => {
  rtcPeerConnection.setRemoteDescription(
    new RTCSessionDescription(responderSdp),
  );
});

socket.on("candidate", (event) => {
  console.log("on condidat");
  const candidate = new RTCIceCandidate({
    sdpMLineIndex: event.lable,
    candidate: event.candidate.candidate,
    sdpMid: event.id,
  });

  rtcPeerConnection.addIceCandidate(candidate);
});
function onIceCondidat(event) {
  if (event.candidate) {
    console.log("sending ice condidate");
    socket.emit("candidate", {
      type: "candidate",
      lable: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate,
      room: roomName,
    });
  }
}
