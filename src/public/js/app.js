const socket = io();

const myFace = document.getElementById("myFace");

let myStream;

async function getMedia() {
    try {
        myStream = await navigator.mediaDevices.getUserMedia( //navigator.mediaDevices.getUserMedia : 유저의 유저미디어 string을 줌
            { // constraints : 기본적으로 우리가 무엇을 얻고 싶은지
                audio: true,
                video: true,
            }
        );
        console.log(myStream);
    } catch (e) {
        console.log(e);
    }
}
getMedia();