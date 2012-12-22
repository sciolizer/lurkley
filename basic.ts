var trs80 = (function() {
  var next = null;
  var quit = false;
  var pg = null;
  var memory = {
    numbers: { },
    strings: { },
    numberArrays: { },
    stringArrays: { }
  };
  var bs = {
    _next: function(n) { if (next == null) { next = n; } },
    _quit: function() { quit = true; },
    assign: function(varName, value) { console.log("assign"); },
    assignArr: function(arrName, arrIndex, value) { console.log("assignArr"); },
    circle: function(x, y, rad, a1, a2, a3, a4) { console.log("circle"); },
    clear: function(n) { console.log("clear"); },
    color: function(a1, a2) { console.log("color"); },
    dim: function(arrName, sizes) { console.log("dim"); },
    draw: function(s) { console.log("draw"); },
    for: function(varName, start, end, step) { console.log("for"); },
    get: function(x, y, a1, a2, arrName) { console.log("get"); },
    // getTo: function() { console.log("getTo"); },
    gosub: function(i) { console.log("gosub"); },
    goto: function(i) { next = pg["line" + i + "_0"]; },
    line: function(x1, y1, x2, y2, psetOrPreset, bf) { console.log("line"); },
    lineTo: function(x2, y2, psetOrPreset, bf) { console.log("lineTo"); },
    next: function(varNameOrEmpty) { console.log("next"); },
    onGoto: function(varName, targets) { console.log("onGoto"); },
    onGosub: function(varName, targets) { console.log("onGosub"); },
    paint: function(x, y, clr, a1) { console.log("paint"); },
    pcls: function(a1) { console.log("pcls"); },
    play: function(s) { console.log("play"); },
    pmode: function(a1, a2) { console.log("pmode"); },
    poke: function(mem, value) { console.log("poke"); },
    pset: function(x,y,clr) { console.log("pset"); },
    put: function(x1,y1,x2,y2,arrName) { console.log("put"); },
    // putTo: function() { console.log("putTo"); },
    return: function() { console.log("return"); },
    screen: function(a1, a2) { console.log("screen"); },
    sound: function(pitch, duration) { console.log("sound"); },
    recall: function(varName) { console.log("recall"); },
    recallArr: function(arrName, ind) { console.log("recallArr"); },
    len: function(s) { console.log("len"); },
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
