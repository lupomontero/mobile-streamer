const video = document.createElement('video');
const startButton = document.createElement('button');
const peerConnection = new RTCPeerConnection();


startButton.innerHTML = 'Start';


document.body.appendChild(video);
document.body.appendChild(startButton);


startButton.addEventListener('click', () => {
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  })
    .then((stream) => {
      alert('Got a stream!');
      video.srcObject = stream;
      video.play();
    })
    .catch((err) => {
      alert(err.message || err);
    });
});
