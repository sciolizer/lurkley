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
  var forStack = []; // [(String, Int, Int, Int, Function)]
  var stack = [];
  var onNext = null;
  var last = function(str) { return str.substring(str.length - 1); }
  var bs = {
    _next: function(n) {
      if (onNext != null) {
        onNext(n);
      } else {
        if (next == null) { next = n; }
      }
      onNext = null;
    },
    _quit: function() { quit = true; },
    assign: function(varName, value) {
      if (last(varName) == "$") {
        memory.numbers[varName] = value;
      } else {
        memory.strings[varName] = value;
      }
    },
    assignArr: function(arrName, arrIndex, value) {
      if (last(arrName) == "$") {
        memory.numberArrays[arrName][arrIndex] = value;
      } else {
        memory.stringArrays[arrName][arrIndex] = value;
      }
    },
    circle: function(x, y, rad, a1, a2, a3, a4) { console.log("circle"); },
    clear: function(n) { console.log("clear"); },
    color: function(a1, a2) { console.log("color"); },
    dim: function(arrName, sizes) {
      if (arrName == "A") {
        ; // hack: ignore A, which is only used for get and put
      } else {
        if (sizes.length != 1) {
          throw "dim only implemented for one-dimensional arrays";
        }
        var size = sizes[0];
        if (last(arrName) == "$") {
          throw "dim not implemented for string arrays";
        } else {
          memory.numberArrays[arrName] = [];
          for (var i = 0; i < size; i++) {
            memory.numberArrays[arrName].push(0)
          }
        }
      }
    },
    draw: function(s) { console.log("draw"); },
    for: function(varName, start, end, step) {
      if ((step > 0 && end < start) || (step < 0 && end > start)) { return; }
      onNext = function(n) {
        forStack.push([varName, start, end, step, n]);
        next = n;
      };
      memory.numbers[varName] = start;
    },
    get: function(x, y, a1, a2, arrName) { console.log("get"); },
    // getTo: function() { console.log("getTo"); },
    gosub: function(i) {
      onNext = function(n) {
        stack.push(n);
        next = pg["line" + i + "_0"];
      };
    },
    goto: function(i) { next = pg["line" + i + "_0"]; },
    line: function(x1, y1, x2, y2, psetOrPreset, bf) { console.log("line"); },
    lineTo: function(x2, y2, psetOrPreset, bf) { console.log("lineTo"); },
    next: function(varNameOrEmpty) {
      var recent;
      do {
        recent = forStack.pop();
        if (!recent) {
          throw "popped off for stack";
        }
      } while (varNameOrEmpty == "" || varNameOrEmpty == recent[0]);
      var varName = recent[0];
      var current = recent[1];
      var end = recent[2];
      var step = recent[3];
      var loopback = recent[4];
      var newval = current + step;
      memory.numbers[varName] = newval;
      if ((step > 0 && newval > end) || (step < 0 && newval < end)) {
        ; // loop is done
      } else {
        forStack.push([varName, newval, end, step, loopback]);
        next = loopback;
      }
    },
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
    return: function() {
      var n = stack.pop();
      if (n) {
        next = n;
      } else {
        throw "return without gosub";
      }
    },
    screen: function(a1, a2) { console.log("screen"); },
    sound: function(pitch, duration) { console.log("sound"); },
    recall: function(varName) {
      if (last(varName) == "$") {
        if (!memory.strings[varName]) { memory.strings[varName] = ""; }
        return memory.strings[varName];
      } else {
        if (!memory.numbers[varName]) { memory.numbers[varName] = ""; }
        return memory.numbers[varName];
      }
    },
    recallArr: function(arrName, ind) {
      var a;
      if (last(arrName) == "$") {
        a = memory.stringArrays[arrName];
      } else {
        a = memory.numberArrays[arrName];
      }
      if (!a) throw ("array not dimmed: " + arrName);
      if (ind < 0 || ind >= a.length) throw ("array out of bounds: " + arrName + "[" + ind + "]")
      return a[ind];
    },
    len: function(s) { console.log("len"); },
    isEqual: function(e1, e2) { console.log("isEqual"); },
    isUnequal: function(e1, e2) { console.log("isUnequal"); },
    isLessThan: function(e1, e2) { console.log("isLessThan"); },
    isLessThanOrEqual: function(e1, e2) { console.log("isLessThanOrEqual"); },
    isGreaterThan: function(e1, e2) { console.log("isGreaterThan"); },
    // isGreaterThanOrEqual: function() { console.log("isGreaterThanOrEqual"); },
    inkey: function() { console.log("inkey"); },
    chr: function(i) { console.log("chr"); },
    instr: function(haystack, needle) { console.log("instr"); },
    int: function(v) { console.log("int"); },
    left: function(str, length) { console.log("left"); },
    mid: function(str, start, length) { console.log("mid"); },
    rnd: function(i) { console.log("rnd"); },
    str: function(i) { console.log("str"); },
    string: function(count, num) { console.log("string"); },
    val: function(str) { console.log("val"); },
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
