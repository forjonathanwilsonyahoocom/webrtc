const Janus = window.Janus;

if (!Janus) {
  throw new Error("Janus JavaScript library was not loaded");
}

Janus.init({
  debug: "all",
  callback() {
    console.log("Janus initialized");
  }
});


