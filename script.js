/* station clock — the only script on the page */
(function () {
  "use strict";

  var clock = document.getElementById("clock");
  if (!clock) return;

  var formatter;
  try {
    formatter = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Sao_Paulo"
    });
  } catch (error) {
    formatter = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }

  function tick() {
    var now = new Date();
    clock.textContent = formatter.format(now) + " BRT";
    clock.dateTime = now.toISOString();
  }

  tick();
  window.setInterval(tick, 30000);
})();
