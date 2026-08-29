const Janus = window.Janus;

if (!Janus) {
  throw new Error("Janus JavaScript library was not loaded");
}

// ---- 1️⃣ Grab the URL query string
const urlParams = new URLSearchParams(window.location.search);
const myRoom = Number(urlParams.get('room')) || 1234;      // default 1234
const displayName = urlParams.get('name') || 'Machine 1'; // default “Machine 1”

console.log(`Joining room ${myRoom} as "${displayName}"`);

// ---- 2️⃣ Keep the rest of your code largely unchanged
let janus, videoroom;

Janus.init({
  debug: "all",
  callback: function () {
    janus = new Janus({
      server: "https://${ENDPOINT}/janus", // adjust if needed
      success: function () {
        janus.attach({
          plugin: "janus.plugin.videoroom",
          success: function (pluginHandle) {
            videoroom = pluginHandle;

            videoroom.send({
              message: {
                request: "join",
                room: myRoom,
                ptype: "publisher",
                display: displayName
              }
            });
          },

          onmessage: function (message, jsep) {
            if (jsep) videoroom.handleRemoteJsep({ jsep });

            if (message.videoroom === "joined") {
              publishAudioOnly();
            }
          },

          onlocaltrack: function (track, on) {
            if (on) {
              const audio = document.createElement("audio");
              audio.autoplay = true;
              audio.muted = true;           // we don’t need to hear ourselves
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

function publishAudioOnly() {
  videoroom.createOffer({
    media: { audio: true, video: false },
    success: function (jsep) {
      videoroom.send({
        message: { request: "publish", audio: true, video: false },
        jsep: jsep
      });
    },
    error: function (error) {
      console.error("Could not create audio offer:", error);
    }
  });
}


