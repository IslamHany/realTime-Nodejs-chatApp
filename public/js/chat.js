const socket = io();
const $messageForm = document.getElementById('message-form');
const $sendLocationButton = document.getElementById('send-location');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $messages = document.getElementById('messages');
const $sidebar = document.getElementById('sidebar');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoscroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild;
    
    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
    
    //Visible height
    const visibleHeight = $messages.offsetHeight;
    
    //Height of messages container
    const containerHeight = $messages.scrollHeight;
    
    //How far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;
    
    //if we are already at the bottom
    if(containerHeight - newMessageHeight <= scrollOffset){
        //scroll to the bottom
        $messages.scrollTop = $messages.scrollHeight;
    }
};

socket.on('message', ({text, createdAt, username}) => {
    const html = Mustache.render(messageTemplate, {
        message: text,
        createdAt: moment(createdAt).format('h:mm a'),
        username
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', ({url, createdAt, username}) => {
    console.log(url);
    const html = Mustache.render(locationMessageTemplate, {
        url,
        createdAt: moment(createdAt).format('h:mm a'),
        username
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    $sidebar.innerHTML = html;
});

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    $messageFormButton.setAttribute('disabled', 'disabled');
    const msg = e.target.elements.message.value;
    if(msg === '') {
        $messageFormButton.removeAttribute('disabled');
        return;
    };
    socket.emit('sendMessage', msg, (error) => {
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = "";
        $messageFormInput.focus();
        if(error){
            return console.log(error);
        }
        console.log("Message delivered");
    });
});

$sendLocationButton.addEventListener('click', () => {
    $sendLocationButton.setAttribute('disabled', 'disabled');
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser');
    }
    navigator.geolocation.getCurrentPosition((position) => {
        const pos = {latitude: position.coords.latitude, longitude: position.coords.longitude};
        socket.emit('sendLocation', pos, () => {
            $sendLocationButton.removeAttribute('disabled');
            console.log('Location shared');
        });
    });
});

socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(error);
        location.href = '/';
    }
});