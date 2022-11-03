const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const mikesSelect = document.getElementById("mikes");
const room = document.getElementById("room");
const call = document.getElementById("call");
const mainTitle = document.getElementById("main-title");

room.classList.add("hidden"); // 첫 화면에서 room 숨겨주기

let myStream;
let muted = false; // default : false; 왜냐면 처음에는 소리가 나는 상태로 시작할거기 때문
let cameraOff = false;
let myPeerConnection;
let myDataChannel;


// Phone Call //// START //

async function makeMediaOption() {
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
            await makeMediaOption();
            flag = false;
        }
    } catch (e) {
        console.log(e);
    }
}
// getMedia(deviceIds);

function handleMuteClick() {
    myStream && myStream
        .getAudioTracks()
        .forEach((track) => {track.enabled = !track.enabled}); // true면 false로 false면 true로 바뀐다
    if(!muted) {
        muteBtn.classList.add("off");
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.classList.remove("off");
        muteBtn.innerText = "Mute";
        muted = false;
    }
}
function handleCameraClick() {
    myStream && myStream
        .getVideoTracks()
        .forEach((track) => {track.enabled = !track.enabled}); // true면 false로 false면 true로 바뀐다
    // console.log(myStream.getVideoTracks());
    if(cameraOff) {
        cameraBtn.classList.remove("off");
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    } else {
        cameraBtn.classList.add("off");
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
    welcome.classList.add("hidden");
    room.classList.remove("hidden");
    mainTitle.classList.add("smaller");
    await getMedia(deviceIds);
    makeConnection();
}

async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    roomName = input.value;
    const title = call.querySelector('h2')
    const span = document.createElement("span");
    span.innerText = "(방이름 : " + input.value + ")";
    title.appendChild(span);
    await initCall();
    socket.emit("join_room", input.value);
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code

socket.on("welcome", async() => { // ⭐ PeerA에서 실행됨
    myDataChannel = myPeerConnection.createDataChannel("chat"); // 채널 추가
    myDataChannel.addEventListener("message", (event) => {
        printMessage(event.data, false); // 출력하고
        // console.log(event.data)
    });
    chat.classList.remove('waiting');
    console.log("made data channel");
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName); // offer를 누구에게 보낼지 함께 전달해야함.
})

socket.on("offer", async(offer) => { // ⭐ PeerB에서 실행됨
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", (event) => {
            printMessage(event.data, false); // 출력하고
            // console.log(event.data)
        });
    }) // data를 출력해준다
    chat.classList.remove('waiting');
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
    myStream && myStream
        .getTracks()
        .forEach(track => myPeerConnection.addTrack(track, myStream));
    // console.log(myStream.getTracks());
};

function handleIce(data) {
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
}

// chat 관련 스크립트 
const chat = document.getElementById("chat");
const chatList = chat.querySelector("ul");
const chatForm = chat.querySelector("form");

function printMessage(message, didISendIt) { // li 출력
    const list = document.createElement("li");
    list.innerText = message;
    if (didISendIt) {
        list.className = "me";
    }
    chatList.appendChild(list);
    chatList.scrollTo(0, chat.scrollHeight); // 스크롤 가장 하단으로 이동 
}

async function handlechatSubmit(event) { // 보내면
    event.preventDefault();
    const input = chatForm.querySelector("input");
    message = input.value; // 값받고
    if (message !== '') {
        printMessage(message, true); // 출력하고
        myDataChannel.send(message);// peer에게 보내고
    }
    input.value = ""; // 값삭제
}
chatForm.addEventListener("submit", handlechatSubmit);