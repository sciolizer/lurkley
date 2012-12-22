var trs80 = (function() {
  var next = null;
  var quit = false;
  var bs = {
    _next: function(n) { if (next == null) { next = n; } },
    _quit: function() { quit = true; },
    clear: function(n) { console.log("clear"); }
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
