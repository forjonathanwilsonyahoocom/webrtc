const Janus = window.Janus;
if (!Janus) throw new Error('Janus JS library not loaded');

const urlParams = new URLSearchParams(window.location.search);
const room = Number(urlParams.get('room')) || 1234;
const displayName = urlParams.get('name') || 'Machine 1';

console.log(`Joining audio room ${room} as "${displayName}"`);

let janus, audiobridge;

Janus.init({
  debug: "all",
  callback: function () {
    janus = new Janus({
      server: "wss://${ENDPOINT}/ws/janus", // <-- correct WS URL
      success: function () {
        janus.attach({
          plugin: "janus.plugin.audiobridge",
          success: function (pluginHandle) {
            audiobridge = pluginHandle;

            // 1️⃣ Create or join the room
            audiobridge.send({
              message: { request: "create", room: room, description: "audio room" }
            });

            // 2️⃣ Join the room as a publisher
            audiobridge.send({
              message: { request: "join", room: room, ptype: "publisher", display: displayName }
            });
          },

          onmessage: function (msg, jsep) {
            // Handle the room’s response
            if (msg.audiobridge === "joined") {
              publishAudio();
            }

            // If we receive a JSEP – it’s a remote participant’s offer
            if (jsep) audiobridge.handleRemoteJsep({ jsep });
          },

          onlocaltrack: function (track, on) {
            if (on) {
              const audio = document.createElement("audio");
              audio.autoplay = true;
              audio.muted = true; // don't hear ourselves
              audio.srcObject = new MediaStream([track]);
              document.body.appendChild(audio);
            }
          },

          onremotetrack: function (track, mid, on) {
            if (on && track.kind === "audio") {
              const audio = document.createElement("audio");
              audio.autoplay = true;
              audio.srcObject = new MediaStream([track]);
              document.body.appendChild(audio);
            }
          }
        });
      }
    });
  }
});

function publishAudio() {
  audiobridge.createOffer({
    media: { audio: true, video: false },
    success: function (jsep) {
      audiobridge.send({
        message: { request: "publish", audio: true, video: false },
        jsep: jsep
      });
    },
    error: function (err) {
      console.error('Failed to create offer', err);
    }
  });
}

