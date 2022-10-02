const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const mikesSelect = document.getElementById("mikes");

const call = document.getElementById("call");

call.hidden = true; // 첫 화면에서 call 숨겨주기

let myStream;
let muted = false; // default : false; 왜냐면 처음에는 소리가 나는 상태로 시작할거기 때문
let cameraOff = false;
let myPeerConnection;
let myDataChannel;

async function getCameras() {
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        const currentAudio = myStream.getAudioTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label == camera.label) {
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        });
        const mikes = devices.filter((device) => device.kind === "audioinput");
        mikes.forEach((mike) => {
            const option = document.createElement("option");
            option.value = mike.deviceId;
            option.innerText = mike.label;
            if(currentAudio.label == mike.label) {
                option.selected = true;
            }
            mikesSelect.appendChild(option);
        });
    }catch(e) {
        console.log(e);
    }
}
let deviceIds = {
    cameraDeviceId: { facingMode: "user"}, 
    audioDeviceId: true,
};
let flag = true;
async function getMedia(deviceIds) {
    try {
        myStream = await navigator.mediaDevices.getUserMedia({
            audio: deviceIds.audioDeviceId,
            video: deviceIds.cameraDeviceId,
        });
        myFace.srcObject = myStream;
        if(flag) { // 처음 실행할 한번만 가져온다.. 그렇지않으면 목록이 자꾸 늘어남
            await getCameras();
            flag = false;
        }
    } catch (e) {
        console.log(e);
    }
}
// getMedia(deviceIds);

function handleMuteClick() {
    myStream
        .getAudioTracks()
        .forEach((track) => {track.enabled = !track.enabled}); // true면 false로 false면 true로 바뀐다
    if(!muted) {
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
}
function handleCameraClick() {
    myStream
        .getVideoTracks()
        .forEach((track) => {track.enabled = !track.enabled}); // true면 false로 false면 true로 바뀐다
    console.log(myStream.getVideoTracks());
    if(cameraOff) {
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    } else {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
}

async function handleCameraChange() {
    deviceIds.cameraDeviceId = { diviceId: { exact: camerasSelect.value}};
    console.log(camerasSelect);
    await getMedia(deviceIds);
    if(myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0]; // 바뀐 새로운 트랙
        const videoSender = myPeerConnection.getSenders().find(sender => sender.track.kind ==="video");
        console.log(videoSender);
        videoSender.replaceTrack(videoTrack);
    }
}
async function handleMikeChange() {
    deviceIds.audioDeviceId = { diviceId: { exact: mikesSelect.value}};
    await getMedia(deviceIds);
    if(myPeerConnection) {
        const audioTrack = myStream.getAudioTracks()[0]; // 바뀐 새로운 트랙
        const audioSender = myPeerConnection.getSenders().find(sender => sender.track.kind ==="audio");
        console.log(audioSender);
        audioSender.replaceTrack(audioTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);
mikesSelect.addEventListener("input", handleMikeChange);

// Phone Call //// END //
// Welcome Form (join a room) //// START //
const welcome = document.getElementById("welcome");
welcomeForm = welcome.querySelector("form");
let roomName;

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia(deviceIds);
    makeConnection();
}

async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code

socket.on("welcome", async() => { // ⭐ PeerA에서 실행됨
    myDataChannel = myPeerConnection.createDataChannel("chat"); // 채널 추가
    myDataChannel.addEventListener("message", (event) => console.log(event.data));
    console.log("made data channel");
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName); // offer를 누구에게 보낼지 함께 전달해야함.
})

socket.on("offer", async(offer) => { // ⭐ PeerB에서 실행됨
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", (event) => console.log(event.data));
    }) // data를 출력해준다
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("sent the answer");
});

socket.on("answer", (answer) => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
})

socket.on("ice", (ice) => {
    console.log("receive candidate");
    myPeerConnection.addIceCandidate(ice);
})


// RTC Code
function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ],
            },
        ],
}); // 이 연결을 모든곳에 공유할것이다
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream
        .getTracks()
        .forEach(track => myPeerConnection.addTrack(track, myStream));
    console.log(myStream.getTracks());
};

function handleIce(data) {
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
}
