var trs80 = (function() {
  var next = null;
  var quit = false;
  var pg = null;
  var bs = {
    _next: function(n) { if (next == null) { next = n; } },
    _quit: function() { quit = true; },
    assign: function() { console.log("assign"); },
    assignArr: function() { console.log("assignArr"); },
    circle: function() { console.log("circle"); },
    clear: function(n) { console.log("clear"); },
    color: function() { console.log("color"); },
    dim: function() { console.log("dim"); },
    draw: function() { console.log("draw"); },
    for: function() { console.log("for"); },
    get: function() { console.log("get"); },
    getTo: function() { console.log("getTo"); },
    gosub: function() { console.log("gosub"); },
    goto: function(i) { next = pg["line" + i + "_0"]; },
    line: function() { console.log("line"); },
    lineTo: function() { console.log("lineTo"); },
    next: function() { console.log("next"); },
    onGoto: function() { console.log("onGoto"); },
    onGosub: function() { console.log("onGosub"); },
    paint: function() { console.log("paint"); },
    pcls: function() { console.log("pcls"); },
    play: function() { console.log("play"); },
    pmode: function() { console.log("pmode"); },
    poke: function() { console.log("poke"); },
    pset: function() { console.log("pset"); },
    put: function() { console.log("put"); },
    putTo: function() { console.log("putTo"); },
    return: function() { console.log("return"); },
    screen: function() { console.log("screen"); },
    sound: function() { console.log("sound"); },
    recall: function() { console.log("recall"); },
    recallArr: function() { console.log("recallArr"); },
    len: function() { console.log("len"); },
    isEqual: function() { console.log("isEqual"); },
    isUnequal: function() { console.log("isUnequal"); },
    isLessThan: function() { console.log("isLessThan"); },
    isLessThanOrEqual: function() { console.log("isLessThanOrEqual"); },
    isGreaterThan: function() { console.log("isGreaterThan"); },
    isGreaterThanOrEqual: function() { console.log("isGreaterThanOrEqual"); },
    inkey: function() { console.log("inkey"); },
    chr: function() { console.log("chr"); },
    instr: function() { console.log("instr"); },
    int: function() { console.log("int"); },
    left: function() { console.log("left"); },
    mid: function() { console.log("mid"); },
    rnd: function() { console.log("rnd"); },
    str: function() { console.log("str"); },
    string: function() { console.log("string"); },
    val: function() { console.log("val"); },
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
      setTimeout(step, 100);
    }
  };
  var run = function(pr, st) {
    pg = pr;
    next = st;
    setTimeout(step, 100);
  };
  return {
    run: run
  };
})()
