//- VIDEO CALL
const socket = io();

const myFace = document.getElementById("myFace");

const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const audiosSelect = document.getElementById("audios");

const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;


async function getCameras(){
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();

        const currentCamera = myStream.getVideoTracks()[0];
        const currentAudio = myStream.getAudioTracks()[0];

        changeMedia(devices, "videoinput", camerasSelect, currentCamera);
        changeMedia(devices, "audioinput", audiosSelect, currentAudio);

        } catch(e) {
        console.log(e);
    }
}

async function getMedia(cameraId, audioId){

    const initialConstraints ={
        audio: true,
        video: { facingMode: "user" },
    }

    const newConstraints ={
        audio: {deviceId: {exact: audioId}},
        video: {deviceId: {exact: cameraId}},
    }



    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            (cameraId && audioId)? newConstraints : initialConstraints
        );

        myFace.srcObject = myStream;
        
        if(!cameraId){
            await getCameras();

        }else{
            if(cameraOff){
                myStream.getVideoTracks().forEach(track => (track.enabled = false))
            } else {
                myStream.getVideoTracks().forEach(track => (track.enabled = true))
            }
                
            if(!muted){
                myStream.getAudioTracks().forEach(track => (track.enabled = true))
            } else {
                myStream.getAudioTracks().forEach(track => (track.enabled = false))
            }
        }

    } catch(e) {        
        console.log(e);
    }
}

function changeMedia(devices, input, select, currentMedia){
    const medias = devices.filter(device => device.kind === input);
        medias.forEach(media => {
            const option = document.createElement("option");
            option.value = media.deviceId;
            option.innerText = media.label;

            if (currentMedia.label === media.label){
                option.selected = true;
            }
            select.appendChild(option);
        })
}

function handleMuteClick(){
    myStream.getAudioTracks().forEach(track => (track.enabled = !track.enabled));
    if(!muted){
        muteBtn.innerText = "Unmute";
        muted = true;
    } else{
        muteBtn.innerText = "Mute";
        muted = false;
    }
}
function handleCameraClick(){
    myStream.getVideoTracks().forEach(track => (track.enabled = !track.enabled));
    if(cameraOff){
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    } else{
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
}

async function handleMediaChange(){
    await getMedia(camerasSelect.value, audiosSelect.value);
    if(myPeerConnection){
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
            .getSenders()
            .find(sender => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleMediaChange);
audiosSelect.addEventListener("input", handleMediaChange);

//Welcome Form (join a room)

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall(){
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(event){
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);


//socket Code

//running on Browser A
socket.on("welcome", async() => {
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message", (event) =>{
        console.log(event.data);
    });
    console.log("made data channel");
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
});

//running on Browser B
socket.on("offer", async(offer) => {
    myPeerConnection.addEventListener("datachannel", (event) =>{
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", (event) =>{
            console.log(event.data);
        });
    })
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("sent the answer");
});

//running on Browser A
socket.on("answer", answer => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
});


//running on both Browsers
socket.on("ice", ice => {
    console.log("received candidate");
    myPeerConnection.addIceCandidate(ice);
})

//RTC Code

function makeConnection(){
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
    });
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
}
function handleIce(data){
    socket.emit("ice", data.candidate, roomName);
    console.log("sent candidate");
}

function handleAddStream(data){
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
}




//- //- SOCKETIO CHAT
// const socket = io();

// const welcome = document.getElementById("welcome");
// const form  = welcome.querySelector("form");
// const room  = document.getElementById("room");
// room.hidden  = true;

// let roomName

// function updateRoomNameSize(newCount){
//     const h3 = room.querySelector("h3");
//     h3.innerText = `Room ${roomName} (${newCount} online)`;
// }

// function showRoom(newCount){
//     welcome.hidden = true;
//     room.hidden = false;
//     updateRoomNameSize(newCount)
//     const msgForm = room.querySelector("#msg");
//     msgForm.addEventListener("submit", handleMessageSubmit);
// }


// function handleRoomSubmit(event){
//     event.preventDefault();
//     const input_roomName = form.querySelector("#room_name");
//     const input_nickname = form.querySelector("#nickname");
//     socket.emit("enter_room", input_roomName.value, input_nickname.value, showRoom);
//     roomName = input_roomName.value;
//     nickname = input_nickname.value;
//     input_roomName.value = "";
//     input_nickname.value = "";
// };

// function addMesasge(message){
//     const ul = room.querySelector("ul");
//     const li = document.createElement("li");
//     li.innerText = message;
//     ul.appendChild(li);
// }

// function handleNicknameSubmit(event){
//     event.preventDefault();
//     const input = room.querySelector("#name input");
//     socket.emit("nickname", input.value);
//     input.value="";
// }

// function handleMessageSubmit(event){
//     event.preventDefault();
//     const input = room.querySelector("#msg input");
//     const value = input.value;
//     socket.emit("new_message", value, roomName, ()=>{
//         addMesasge(`You: ${value}`);
//     });
//     input.value="";
// }

// form.addEventListener("submit", handleRoomSubmit);

// socket.on("welcome", (user, newCount) =>{
//     updateRoomNameSize(newCount)
//     addMesasge(`${user} joined!`);
// });

// socket.on("bye", (user, newCount) => {
//     updateRoomNameSize(newCount)
//     addMesasge(`${user} left!`);
// });

// //socket.on("new_message", addMessage) <- same thing
// socket.on("new_message", (msg) =>{
//     addMesasge(msg);
// })

// socket.on("room_list_update", (rooms) =>{
//     const roomList = welcome.querySelector("ul");

//     roomList.innerHTML = "";

//     if(rooms.length === 0){
//         const li = document.createElement("li");
//         li.innerText = "None"
//         roomList.append(li);
//     }else{
    
//     rooms.forEach((room) => {
//         const li = document.createElement("li");
//         li.innerText = room;
//         roomList.append(li);
//     })
//     }
// })