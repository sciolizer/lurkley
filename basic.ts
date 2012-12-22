var trs80 = (function() {
  var next = null;
  var quit = false;
  var bs = {
    _next: function(n) { if (next == null) { next = n; } },
    _quit: function() { quit = true; },
    assign: null,
    assignArr: null,
    circle: null,
    clear: function(n) { console.log("clear"); }
    color: null,
    dim: null,
    draw: null,
    for: null,
    get: null,
    getTo: null,
    gosub: null,
    goto: null,
    line: null,
    lineTo: null,
    next: null,
    onGoto: null,
    onGosub: null,
    paint: null,
    pcls: null,
    play: null,
    pmode: null,
    poke: null,
    pset: null,
    put: null,
    putTo: null,
    return: null,
    screen: null,
    sound: null,
    recall: null,
    recallArr: null,
    inkey: null,
    len: null
  };
  var step = function() {
    if (next == null) {
      alert("error: next unspecified and quit not invoked");
      throw "blah";
    }
    var n = next;
    next = null;
    n(bs);
    if (quit) {
      console.log("done");
    } else {
      setTimeout(step, 1000);
    }
  };
  var run = function(pr, st) {
    next = st;
    setTimeout(step, 100);
  };
  return {
    run: run
  };
})()
