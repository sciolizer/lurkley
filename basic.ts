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
      // console.log("assign: " + varName + " = " + value);
      if (typeof value == typeof undefined) {
        throw "attempted to assign undefined";
      }
      if (last(varName) == "$") {
        memory.strings[varName] = value;
      } else {
        memory.numbers[varName] = value;
      }
    },
    assignArr: function(arrName, arrIndex, value) {
      if (typeof value == typeof undefined) {
        throw "attempted to assignArr undefined";
      }
      if (last(arrName) == "$") {
        memory.stringArrays[arrName][arrIndex] = value;
      } else {
        memory.numberArrays[arrName][arrIndex] = value;
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
      console.log("for: " + varName + ", " + start + ", " + end + ", " + step);
      if ((step > 0 && end < start) || (step < 0 && end > start)) { return; }
      onNext = function(n) {
        forStack.push([varName, start, end, step, n]);
        console.log("starting for loop: " + varName);
        console.log(forStack.slice(0));
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
      // console.log("attempting next with variable: " + varNameOrEmpty);
      var recent;
      do {
        // console.log("popping off of for stack");
        // console.log(forStack.slice(0));
        recent = forStack.pop();
        if (!recent) {
          throw ("popped off for stack: " + varNameOrEmpty);
        }
      } while (varNameOrEmpty != "" && varNameOrEmpty != recent[0]);
      // console.log("found a match for the variable name");
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
        // console.log("pushing back onto for stack");
        forStack.push([varName, newval, end, step, loopback]);
        // console.log(forStack.slice(0));
        next = loopback;
      }
    },
    onGoto: function(varName, targets) {
      var index = memory.numbers[varName];
      if (index != 0 || !index) throw ("bad onGoto: " + varName);
      if (index < 1 || index > targets.length) throw ("out of range onGoto: " + index);
      next = pg["line" + targets[index - 1] + "_0"]; // on goto is 1 based
    },
    onGosub: function(varName, targets) {
      var index = memory.numbers[varName];
      if (index != 0 || !index) throw ("bad onGosub: " + varName);
      if (index < 1 || index > targets.length) throw ("out of range onGosub: " + index);
      onNext = function(n) {
        stack.push(n);
        next = pg["line" + index + "_0"];
      };
    },
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
    len: function(s) { return s.length; },
    isEqual: function(e1, e2) { return e1 == e2; },
    isUnequal: function(e1, e2) { return e1 != e2; },
    isLessThan: function(e1, e2) { return e1 < e2; },
    isLessThanOrEqual: function(e1, e2) { return e1 <= e2; },
    isGreaterThan: function(e1, e2) { return e1 > e2; },
    // isGreaterThanOrEqual: function() { console.log("isGreaterThanOrEqual"); },
    inkey: function() { console.log("inkey"); },
    asc: function(c) { return c.charCodeAt(0); },
    chr: function(i) { return String.fromCharCode(i); },
    instr: function(haystack, needle) { console.log("instr"); },
    int: function(v) { return Math.round(v - 0.5); },
    left: function(str, length) { return str.substring(0, length); },
    mid: function(str, start, length) { return str.substring(start, start + length); },
    rnd: function(i) { console.log("rnd"); },
    str: function(i) { return "" + i; },
    string: function(count, num) {
      var ret = "";
      for (var i = 0; i < num; i++) {
        ret = ret + String.fromCharCode(num);
      }
      return ret;
    },
    val: function(str) { return parseInt(str); }
  };
  var step = function() {
    if (next == null) {
      alert("error: next unspecified and quit not invoked");
      throw "blah";
    }
    var n = next;
    next = null;
    // console.log(n);
    n(bs);
    if (quit) {
      console.log("done");
    } else {
      setTimeout(step, 10);
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
