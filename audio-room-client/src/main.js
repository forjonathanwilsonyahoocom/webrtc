import Janus from "janus-gateway";
import "webrtc-adapter";

Janus.init({
  debug: "all",
  callback() {
    console.log("Janus client initialized");
  }
});

