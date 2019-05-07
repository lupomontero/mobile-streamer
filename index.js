const root = document.getElementById('root');
const video = document.createElement('video');
const broadcastButton = document.createElement('button');
const poolList = document.createElement('ul');


const config = {
  iceServers: [{ urls: ['stun:stun.1.google.com:19302'] }],
};


const ws = new WebSocket('ws://192.168.1.2:8080/');
let pool = [];


broadcastButton.innerHTML = 'Start';


root.appendChild(video);
root.appendChild(broadcastButton);
root.appendChild(poolList);


const updatePool = (newPool) => {
  pool = newPool;
  poolList.innerHTML = '';
  pool.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = item.displayName;
    poolList.appendChild(li);
  });
};


broadcastButton.addEventListener('click', () => {
  const displayName = prompt('Display name:');

  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  })
    .then((stream) => {
      video.srcObject = stream;
      video.play();

      const peerConnection = new RTCPeerConnection(config);
      peerConnection.addStream(stream);
      peerConnection.createOffer()
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => ws.send(JSON.stringify({
          type: 'peerConnectionOffer',
          displayName,
          sessionDescription: peerConnection.localDescription,
        })));

      ws.addEventListener('message', (e) => {
        const parsed = JSON.parse(e.data);
        if (parsed.type === 'peerConnectionAnswer') {
          peerConnection.setRemoteDescription(parsed.sessionDescription);
        }
      });
    })
    .catch((err) => {
      alert(err.message || err);
    });
});



poolList.addEventListener('click', (e) => {
  if (e.target.tagName !== 'LI') {
    return;
  }

  const offer = pool.find(item => item.displayName === e.target.innerHTML);
  const peerConnection = new RTCPeerConnection(config);

  console.log('offer.sessionDescription', offer.sessionDescription);

  peerConnection.setRemoteDescription(offer.sessionDescription)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      ws.send(JSON.stringify({
        type: 'peerConnectionAnswer',
        sessionDescription: peerConnection.localDescription,
      }));
    });

  peerConnection.addEventListener('addStream', (event) => {
    console.log('stream added!', event.stream);
  });
});


ws.addEventListener('message', (e) => {
  const parsed = JSON.parse(e.data);
  console.log('ws::message', parsed);
  if (parsed.type === 'peerConnectionPoolUpdate') {
    updatePool(parsed.pool);
  }
});
