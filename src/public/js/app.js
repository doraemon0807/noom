const socket = io();

const welcome = document.getElementById("welcome");
const form  = welcome.querySelector("form");
const room  = document.getElementById("room");
room.hidden  = true;

let roomName

function updateRoomNameSize(newCount){
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount} online)`;
}

function showRoom(newCount){
    welcome.hidden = true;
    room.hidden = false;
    updateRoomNameSize(newCount)
    const msgForm = room.querySelector("#msg");
    msgForm.addEventListener("submit", handleMessageSubmit);
}


function handleRoomSubmit(event){
    event.preventDefault();
    const input_roomName = form.querySelector("#room_name");
    const input_nickname = form.querySelector("#nickname");
    socket.emit("enter_room", input_roomName.value, input_nickname.value, showRoom);
    roomName = input_roomName.value;
    nickname = input_nickname.value;
    input_roomName.value = "";
    input_nickname.value = "";
};

function addMesasge(message){
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function handleNicknameSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#name input");
    socket.emit("nickname", input.value);
    input.value="";
}

function handleMessageSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#msg input");
    const value = input.value;
    socket.emit("new_message", value, roomName, ()=>{
        addMesasge(`You: ${value}`);
    });
    input.value="";
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user, newCount) =>{
    updateRoomNameSize(newCount)
    addMesasge(`${user} joined!`);
});

socket.on("bye", (user, newCount) => {
    updateRoomNameSize(newCount)
    addMesasge(`${user} left!`);
});

//socket.on("new_message", addMessage) <- same thing
socket.on("new_message", (msg) =>{
    addMesasge(msg);
})

socket.on("room_list_update", (rooms) =>{
    const roomList = welcome.querySelector("ul");

    roomList.innerHTML = "";

    if(rooms.length === 0){
        const li = document.createElement("li");
        li.innerText = "None"
        roomList.append(li);
    }else{
    
    rooms.forEach((room) => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    })
    }
})