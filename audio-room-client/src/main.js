const Janus = window.Janus;
if (!Janus) throw new Error("Janus JS library not loaded");

const urlParams = new URLSearchParams(window.location.search);
const room = Number(urlParams.get("room")) || 1234;
const displayName = urlParams.get("name") || "Machine 1";

console.log(`Joining audio room ${room} as "${displayName}"`);

let janus;
let audiobridge;

Janus.init({
  debug: "all",

  callback: function () {
    janus = new Janus({
      server: "wss://${ENDPOINT}/ws/janus",
      iceServers: ["${ENDPOINT}"],
      success: function () {
        janus.attach({
          plugin: "janus.plugin.audiobridge",
          opaqueId: "audiobridgetest-" + Janus.randomString(12),
        //  trickle: false, // <-- Add this line explicitly to disable trickle ICE
           
          success: function (pluginHandle) {
            audiobridge = pluginHandle;
            Janus.log("Plugin attached! (" + audiobridge.getPlugin() + ", id=" + audiobridge.getId() + ")");
       
            console.log("AudioBridge attached:", audiobridge.getId());

            // Room 1234 already exists; don't create it.
            audiobridge.send({
              message: {
                request: "join",
                room: room,
                ptype: "publisher",
                display: displayName
              }
            });
          },

          error: function (error) {
            console.error("AudioBridge attach error:", error);
          },

          onmessage: function (msg, jsep) {
            console.log("JANUS MESSAGE:", JSON.stringify(msg, null, 2));

            if (jsep) {
              console.log("========== JANUS JSEP ==========");
              console.log(jsep);
              console.log("================================");

              audiobridge.handleRemoteJsep({
                jsep: jsep
              });
            }

            if (msg.audiobridge === "joined") {
              console.log("JOINED — publishing audio");
              publishAudio();
            }
          },

          onlocaltrack: function (track, on) {
            console.log("LOCAL TRACK:", {
              id: track.id,
              kind: track.kind,
              enabled: track.enabled,
              readyState: track.readyState,
              on: on
            });
          },

          onremotetrack: function (track, mid, on) {
            console.log("REMOTE TRACK:", {
              id: track.id,
              kind: track.kind,
              enabled: track.enabled,
              readyState: track.readyState,
              mid: mid,
              on: on
            });

            if (on && track.kind === "audio") {
              const audio = document.createElement("audio");
              audio.autoplay = true;
              audio.playsInline = true;
              audio.srcObject = new MediaStream([track]);

              document.body.appendChild(audio);

              audio.play().catch(err => {
                console.error("Remote audio play failed:", err);
              });
            }
          },

          iceState: function (state) {
            console.log("ICE state:", state);
          }
        });
      },

      error: function (error) {
        console.error("Janus error:", error);
      },

      destroyed: function () {
        console.log("Janus destroyed");
      }
    });
  }
});

function publishAudio() {
  console.log("Creating audio offer...");

  audiobridge.createOffer({
    media: {
      audio: true,
      video: false
    },

   // trickle: false,
    
    success: function (jsep) {
      console.log("========== LOCAL OFFER ==========");
      console.log(jsep);
      console.log("=================================");
        
      audiobridge.send({
        message: {
            request: "configure",
            muted: false
        },
        jsep: jsep
      });
    },

    error: function (err) {
      console.error("Failed to create offer:", err);
    }
  });
}

