declare var processingQueue;
var PI = 3.14159265358;
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
  var process = function(f) {
    processingQueue.unshift(f);
  };
  var psetPreset = function(which) {
    if (which == "pset") {
      return cocoColor(drawing.foregroundColor);
    } else if (which == "preset") {
      return cocoColor(drawing.backgroundColor);
    } else {
      throw ("unrecognized pset/preset: " + which);
    }
  };
  var drawing = {
    foregroundColor: 1,
    backgroundColor: 0,
    mode: 3, // I think this determines resolution
    screen: "text", // "text" or "graphics"
    colorset: 0, // 0 or 1
    lastX: 0,
    lastY: 0
  };
  var cocoColor = function(i) {
    switch (i) {
      case 0: // black
        return [0, 0, 0];
      case 1: // green
        return [0, 128, 0];
      case 2: // yellow
        return [255, 255, 0];
      case 3: // blue
        return [0, 0, 255];
      case 4: // red
        return [255, 0, 0];
      case 5: // white
        return [255, 255, 255];
      case 6: // cyan
        return [0, 255, 255];
      case 7: // magenta
        return [255, 0, 255];
      case 8: // orange
        return [255, 165, 0];
    }
    throw ("unrecognized color: " + i);
  };
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
    circle: function(x, y, rad, clr, ratio, start, end) { // todo: fix defaults
      process(function(p) {
        var c = clr;
        if (typeof clr == typeof undefined) {
          c = drawing.foregroundColor;
        }
        p.stroke.apply(p, cocoColor(c));
        p.fill.apply(p, cocoColor(c)); // do I need both of these?
        p.arc(x, y, rad, ratio * rad, start * 2 * PI, end * 2 * PI);
        p.noStroke();
      });
    },
    clear: function(n) { ; /* no-op; os handles memory management */ },
    color: function(foreground, background) {
      process(function(p) {
        drawing.foregroundColor = foreground;
        drawing.backgroundColor = background;
      });
    },
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
    draw: function(s) {
      process(function(p) {
        var blank = false;
        var distance = 0;
        var color = false;
        var xdirection = 0;
        var ydirection = 0;
        var flushed = true;
        var flush = function() {
          if (flushed) return;
          if (color) {
            drawing.foregroundColor = distance;
          } else {
            p.stroke.apply(p, cocoColor(drawing.foregroundColor));
            p.fill.apply(p, cocoColor(drawing.foregroundColor));
            if (distance == 0) distance = 1;
            var newx = drawing.lastX + distance * xdirection;
            var newy = drawing.lastY + distance * ydirection;
            if (!blank) {
              p.line(drawing.lastX, drawing.lastY, newx, newy);
            }
            drawing.lastX = newx;
            drawing.lastY = newy;
          }
          blank = false;
          distance = 0;
          color = false;
          xdirection = 0;
          ydirection = 0;
          p.noStroke();
          flushed = true;
        };
        for (var i = 0; i < s.length; i++) {
          switch (s[i]) {
            case "B":
              flush();
              blank = true;
              break;
            case "M":
              flush();
              var front = i + 1;
              var back = s.indexOf(";", front);
              var chunk = s.substring(front, back);
              var coords = chunk.split(",")
              if (coords.length != 2) {
                throw ("invalid coords: " + chunk);
              }
              if (!blank) {
                p.stroke.apply(p, cocoColor(drawing.foregroundColor));
                p.fill.apply(p, cocoColor(drawing.foregroundColor));
                p.line(drawing.lastX, drawing.lastY, coords[0], coords[1]);
              }
              i = back - 1;
              drawing.lastX = coords[0];
              drawing.lastY = coords[1];
              blank = false;
              distance = 0;
              color = false;
              xdirection = 0;
              ydirection = 0;
              p.noStroke();
              flushed = true;
              break;
            case "U":
              flush(); flushed = false;
              ydirection = -1;
              break;
            case "D":
              flush(); flushed = false;
              ydirection = 1;
              break;
            case "L":
              flush(); flushed = false;
              xdirection = -1;
              break;
            case "R":
              flush(); flushed = false;
              xdirection = 1;
              break;
            case "E":
              flush(); flushed = false;
              ydirection = -1; xdirection = 1;
              break;
            case "F":
              flush(); flushed = false;
              ydirection = 1; xdirection = 1;
              break;
            case "G":
              flush(); flushed = false;
              ydirection = 1; xdirection = -1;
              break;
            case "H":
              flush(); flushed = false;
              ydirection = -1; xdirection -1;
              break;
            case "S":
              flush(); flushed = false;
              throw "scale not implemented for draw";
              break;
            case "C":
              flush(); flushed = false;
              color = true;
              break;
            case ";":
              flush();
              break;
            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
              distance = 10 * distance + parseInt(s[i])
              break;
            default:
              throw ("draw can't handle: " + s[i] + " in " + s);
          }
        }
      });
    },
    for: function(varName, start, end, step) {
      // console.log("for: " + varName + ", " + start + ", " + end + ", " + step);
      if ((step > 0 && end < start) || (step < 0 && end > start)) { return; }
      onNext = function(n) {
        forStack.push([varName, start, end, step, n]);
        // console.log("starting for loop: " + varName);
        // console.log(forStack.slice(0));
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
    line: function(x1, y1, x2, y2, psetOrPreset, bf) {
      if (bf == "") {
        process(function(p) {
          var color = psetPreset(psetOrPreset);
          p.stroke.apply(p, color);
          p.fill.apply(p, color); // do I need both of these?
          p.line(x1, y1, x2, y2);
          p.noStroke();
          drawing.lastX = x2;
          drawing.lastY = y2;
        });
      } else {
        throw ("line not implemented for b or bf: " + bf);
      }
    },
    lineTo: function(x2, y2, psetOrPreset, bf) {
      if (bf == "") {
        process(function(p) {
          var color = psetPreset(psetOrPreset);
          p.stroke.apply(p, color);
          p.fill.apply(p, color); // do I need both of these?
          p.line(drawing.lastX, drawing.lastY, x2, y2);
          p.noStroke();
          drawing.lastX = x2;
          drawing.lastY = y2;
        });
      } else {
        throw ("line not implemented for b or bf: " + bf);
      }
    },
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
      if (index != 0 && !index) throw ("bad onGoto: " + varName);
      if (index < 1 || index > targets.length) throw ("out of range onGoto: " + index);
      next = pg["line" + targets[index - 1] + "_0"]; // on goto is 1 based
    },
    onGosub: function(varName, targets) {
      var index = memory.numbers[varName];
      //console.log("index");
      //console.log(index);
      if (index != 0 && !index) throw ("bad onGosub: " + varName);
      if (index < 1 || index > targets.length) throw ("out of range onGosub: " + index);
      onNext = function(n) {
        stack.push(n);
        next = pg["line" + index + "_0"];
      };
    },
    paint: function(x, y, clr, a1) { console.log("paint"); },
    pcls: function(color) {
      process(function(p) {
        p.background.apply(p, cocoColor(color));
      });
    },
    play: function(s) { console.log("play"); },
    pmode: function(mode, a) {
      process(function(p) {
        // a ignored
        drawing.mode = mode;
      });
    },
    poke: function(mem, value) {
      console.log("poke");
    },
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
    screen: function(gort, colorset) {
      process(function(p) {
        if (gort == 0) {
          drawing.screen = "text";
        } else if (gort == 1 || gort == 2 || gort == 3) { // todo
          drawing.screen = "graphics";
        } else {
          throw ("invalid screen mode: " + gort);
        }
        drawing.colorset = colorset;
      });
    },
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
    instr: function(haystack, needle) { return haystack.indexOf(needle) + 1; },
    int: function(v) { return Math.round(v - 0.5); },
    left: function(str, length) { return str.substring(0, length); },
    mid: function(str, start, length) { return str.substring(start + 1, start + 1 + length); },
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
    console.log(n);
    n(bs);
    if (quit) {
      console.log("done");
    } else {
      setTimeout(step, 10);
    }
  };
  var run = function(pr, st) {
    process(function(p) {
      p.noStroke();
    });
    pg = pr;
    next = st;
    setTimeout(step, 100);
  };
  return {
    run: run
  };
})()
