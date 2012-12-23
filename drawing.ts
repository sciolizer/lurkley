declare var processingQueue;
var process = function(f) {
  processingQueue.unshift(f);
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
var drawing = {
  foregroundColor: 1,
  backgroundColor: 0,
  mode: 3, // I think this determines resolution
  screen: "text", // "text" or "graphics"
  colorset: 0, // 0 or 1
  lastX: 0,
  lastY: 0
};
var suspended = function() { return false; };
var draw = function(s) {
  if (suspended()) return;
  process(function(p) {
    var blank = false;
    var distance = 0;
    var color = false;
    var xdirection = 0;
    var ydirection = 0;
    var flushed = true;
    var flush = function() {
      console.log("called flush() when flushed = " + flushed);
      if (flushed) return;
      if (color) {
        drawing.foregroundColor = distance;
      } else {
        p.stroke.apply(p, cocoColor(drawing.foregroundColor));
        p.fill.apply(p, cocoColor(drawing.foregroundColor));
        if (distance == 0) distance = 1;
        console.log("else lastX: " + drawing.lastX);
        console.log("else distance: " + distance);
        console.log("else xdirection: " + xdirection);
        var newx = drawing.lastX + distance * xdirection;
        var newy = drawing.lastY + distance * ydirection;
        if (!blank) {
          console.log("drawing a line!");
          console.log("drawing.lastX: " + drawing.lastX);
          console.log("drawing.lastY: " + drawing.lastY);
          console.log("newx: " + newx);
          console.log("newy: " + newy);
          p.line(drawing.lastX, drawing.lastY, newx, newy);
        } else {
          console.log("blank move");
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
      console.log("s[i] = " + s[i]);
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
          console.log("coords: " + coords);
          if (!blank) {
            console.log("non blank move");
            p.stroke.apply(p, cocoColor(drawing.foregroundColor));
            p.fill.apply(p, cocoColor(drawing.foregroundColor));
            p.line(drawing.lastX, drawing.lastY, coords[0], coords[1]);
          } else {
            console.log("blank move");
          }
          i = back - 1;
          drawing.lastX = parseInt(coords[0]);
          drawing.lastY = parseInt(coords[1]);
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
          console.log("old distance: " + distance);
          distance = 10 * distance + parseInt(s[i])
          console.log("new distance: " + distance);
          break;
        default:
          throw ("draw can't handle: " + s[i] + " in " + s);
      }
    }
    flush();
  });
};
/*
var PI = 3.14159265358;
var MAX_X = 511; // 255;
var MAX_Y = 384; // 192;
var memory = {
  numbers: { },
  strings: { },
  numberArrays: { },
  stringArrays: { }
};
var trs80 = (function() {
  var next = null;
  var quit = false;
  var pg = null;
  var suspencion = [];
  var suspended = function() {
    return suspencion.length > 0;
  };
  var forStack = []; // [(String, Int, Int, Int, Function)]
  var stack = [];
  var onNext = null;
  var last = function(str) { return str.substring(str.length - 1); };
  var checkComparison = function(str, l, r) {
    if (typeof l == typeof undefined) {
      throw ("left of " + str + " is undefined");
    }
    if (typeof r == typeof undefined) {
      throw ("right of " + str + " is undefined");
    }
    if (typeof l != typeof r) {
      throw (str + " types are not the same");
    }
  };
  var checkNumeric = function(str, l, r) {
    if (typeof l != typeof 0) {
      throw ("left of " + str + " not a number: " + l);
    }
    if (typeof r != typeof 0) {
      throw ("right of " + str + " not a number: " + r);
    }
  };
  var boundCheck = function(str, val, min, max) {
    if (typeof val != typeof 0) {
      throw (str + " not a number")
    }
    if (val < min) {
      throw (str + " less than min of " + min + ": " + val);
    }
    if (val > max) {
      throw (str + " more than max of " + max + ": " + val);
    }
  };
  var findLine = function(varName, targets) {
    var index = memory.numbers[varName];
    if (typeof index == typeof undefined) {
      throw ("bad onGoto/onGosub: " + varName);
    }
    if (index < 1 || index > targets.length) throw ("out of range onGoto/onGosub: " + index);
    var key = "line" + targets[index - 1] + "_0"; // is 1 based
    var ret = pg[key]; // is 1 based
    if (typeof ret == typeof undefined) {
      throw ("There is no line: " + key);
    }
    return ret;
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
      if (suspended()) return;
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
      if (suspended()) return;
      if (typeof value == typeof undefined) {
        throw "attempted to assignArr undefined";
      }
      var arr;
      if (last(arrName) == "$") {
        arr = memory.stringArrays[arrName];
      } else {
        arr = memory.numberArrays[arrName];
      }
      if (typeof arr == typeof undefined) {
        throw ("no arr with name " + arrName);
      }
      if (arrIndex < 0 || arrIndex >= arr.length) {
        throw ("out of bounds array assignment: " + arrIndex)
      }
      arr[arrIndex] = value;
    },
    circle: function(x, y, rad, clr, ratio, start, end) { // todo: fix defaults
      if (suspended()) return;
      // console.log("circle: " + x + ", " + rad + 
      if (ratio < 0 || ratio > 4) {
        throw ("invalid circle ratio: " + ratio)
      }
      if (start < 0 || start > 1) {
        throw ("invalid circle start: " + start)
      }
      if (end < 0 || end > 1) {
        throw ("invalid circle end: " + end)
      }
      if (x < 0 || x > MAX_X) {
        throw ("invalid circle x: " + x)
      }
      if (y < 0 || y > MAX_Y) {
        throw ("invalid circle y: " + y)
      }
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
    clear: function(n) {
      if (suspended()) return;
      ; // no-op; os handles memory management
    },
    color: function(foreground, background) {
      if (suspended()) return;
      boundCheck("color foreground", foreground, 0, 8);
      boundCheck("color background", background, 0, 8);
      process(function(p) {
        drawing.foregroundColor = foreground;
        drawing.backgroundColor = background;
      });
    },
    dim: function(arrName, sizes) {
      if (suspended()) return;
      if (arrName == "A") {
        ; // hack: ignore A, which is only used for get and put
      } else if (arrName == "B") {
        if (sizes.length != 1) {
          throw "dim only implemented for one-dimensional arrays";
        }
        var size = sizes[0];
        boundCheck("dim size", size, 0, undefined);
        if (last(arrName) == "$") {
          throw "dim not implemented for string arrays";
        } else {
          memory.numberArrays[arrName] = [];
          for (var i = 0; i < size; i++) {
            memory.numberArrays[arrName].push(0)
          }
        }
      } else {
        throw "unequipped to handle any array except B"
      }
    },
    for: function(varName, start, end, step) {
      if (suspended()) {
        suspencion.push(varName);
        return;
      }
      // console.log("for: " + varName + ", " + start + ", " + end + ", " + step);
      if ((step > 0 && end < start) || (step < 0 && end > start)) {
        console.log("void for loop");
        suspencion.push(varName);
        return;
      }
      onNext = function(n) {
        forStack.push([varName, start, end, step, n]);
        // console.log("starting for loop: " + varName);
        // console.log(forStack.slice(0));
        next = n;
      };
      memory.numbers[varName] = start;
    },
    get: function(x, y, a1, a2, arrName) {
      if (suspended()) return;
      console.log("get");
    },
    // getTo: function() { console.log("getTo"); },
    gosub: function(i) {
      if (suspended()) return;
      onNext = function(n) {
        stack.push(n);
        next = pg["line" + i + "_0"];
      };
    },
    goto: function(i) {
      if (suspended()) return;
      next = pg["line" + i + "_0"];
    },
    line: function(xorig, yorig, x2, y2, psetOrPreset, bf) {
      if (suspended()) return;
      console.log("line: " + xorig + ", " + yorig + ", " + x2 + ", " + y2 + ", " + psetOrPreset + ", " + bf);
      if (typeof xorig != typeof undefined) {
        boundCheck("line xorig", xorig, 0, MAX_X);
      }
      if (typeof yorig != typeof undefined) {
        boundCheck("line yorig", yorig, 0, MAX_Y);
      }
      boundCheck("line x2", x2, 0, MAX_X);
      boundCheck("line y2", y2, 0, MAX_Y);
      process(function(p) {
        var color = psetPreset(psetOrPreset);
        var x1;
        var y1;
        if (typeof xorig == typeof undefined) {
          x1 = drawing.lastX;
        } else {
          x1 = xorig;
        }
        if (typeof yorig == typeof undefined) {
          y1 = drawing.lastY;
        } else {
          y1 = yorig;
        }
        if (bf == "") {
          p.stroke.apply(p, color);
          p.fill.apply(p, color); // do I need both of these?
          p.line(x1, y1, x2, y2);
          p.noStroke();
        } else if (bf == "b") {
          p.noFill();
          p.stroke.apply(p, color);
          p.rect(x1, y1, x2 - x1, y2 - x1)
          p.noStroke();
        } else if (bf == "bf") {
          p.fill.apply(p, color);
          p.stroke.apply(p, color);
          p.rect(x1, y1, x2 - x1, y2 - x1)
          p.noStroke();
          p.noFill();
        } else {
          throw ("line not implemented for bf: " + bf);
        }
        drawing.lastX = x2;
        drawing.lastY = y2;
      });
    },
    lineTo: function(x2, y2, psetOrPreset, bf) {
      if (suspended()) return;
      bs.line(undefined, undefined, x2, y2, psetOrPreset, bf);
    },
    next: function(varNameOrEmpty) {
      if (suspended()) {
        var topS;
        do {
          topS = suspencion.pop();
          if (typeof topS == typeof undefined) {
            throw "suspencion popped all the way off";
          }
        } while (varNameOrEmpty != "" && varNameOrEmpty != topS);
        return;
      }
      // console.log("attempting next with variable: " + varNameOrEmpty);
      var recent;
      do {
        // console.log("popping off of for stack: " + varNameOrEmpty);
        // console.log(forStack.slice(0));
        recent = forStack.pop();
        // console.log("found variable: " + recent);
        // console.log("it's going to take me to ");
        // console.log(loopback);
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
      if (suspended()) return;
      next = findLine(varName, targets);
    },
    onGosub: function(varName, targets) {
      if (suspended()) return;
      var nn = findLine(varName, targets);
      onNext = function(n) {
        stack.push(n);
        // console.log("next from within onGosub: " + next);
        next = nn;
      };
    },
    paint: function(x, y, clr, a1) {
      if (suspended()) return;
      console.log("paint");
    },
    pcls: function(color) {
      if (suspended()) return;
      process(function(p) {
        p.background.apply(p, cocoColor(color));
      });
    },
    play: function(s) {
      if (suspended()) return;
      console.log("play");
    },
    pmode: function(mode, a) {
      if (suspended()) return;
      process(function(p) {
        // a ignored
        drawing.mode = mode;
      });
    },
    poke: function(mem, value) {
      if (suspended()) return;
      console.log("poke");
    },
    pset: function(x,y,clr) {
      if (suspended()) return;
      process(function(p) {
        console.log("pset");
        drawing.lastX = x;
        drawing.lastY = y;
      });
    },
    put: function(x1,y1,x2,y2,arrName) {
      if (suspended()) return;
      console.log("put");
    },
    // putTo: function() { console.log("putTo"); },
    return: function() {
      if (suspended()) return;
      var n = stack.pop();
      if (typeof n == typeof undefined) {
        throw "return without gosub";
      } else {
        next = n;
      }
    },
    screen: function(gort, colorset) {
      if (suspended()) return;
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
    sound: function(pitch, duration) {
      if (suspended()) return;
      console.log("sound");
    },
    recall: function(varName) {
      if (last(varName) == "$") {
        var ret = memory.strings[varName];
        if (typeof ret != typeof "") {
          // throw ("tried to recall: " + varName);
          memory.strings[varName] = "";
          ret = "";
        }
        // console.log(varName + ": " + ret);
        return ret;
      } else {
        var ret = memory.numbers[varName];
        if (typeof ret != typeof 0) {
          // throw ("tried to recall: " + varName);
          memory.numbers[varName] = 0;
          ret = 0;
        }
        // console.log(varName + ": " + ret);
        return ret;
      }
    },
    recallArr: function(arrName, ind) {
      var a;
      if (last(arrName) == "$") {
        a = memory.stringArrays[arrName];
      } else {
        a = memory.numberArrays[arrName];
      }
      if (typeof a == typeof undefined) throw ("array not dimmed: " + arrName);
      if (ind < 0 || ind >= a.length) throw ("array out of bounds: " + arrName + "[" + ind + "]")
      var ret = a[ind];
      if (typeof ret == typeof undefined) {
        throw ("retrieved undefined value at " + ind + " in " + a);
      }
      return ret;
    },
    len: function(s) { return s.length; },
    isEqual: function(e1, e2) {
      checkComparison("isEqual", e1, e2);
      return e1 == e2;
    },
    isUnequal: function(e1, e2) {
      checkComparison("isUnequal", e1, e2);
      return e1 != e2;
    },
    isLessThan: function(e1, e2) {
      checkNumeric("isLessThan", e1, e2);
      return e1 < e2;
    },
    isLessThanOrEqual: function(e1, e2) {
      checkNumeric("isLessThanOrEqual", e1, e2);
      return e1 <= e2;
    },
    isGreaterThan: function(e1, e2) {
      checkNumeric("isGreaterThan", e1, e2);
      return e1 > e2;
    },
    // isGreaterThanOrEqual: function() { console.log("isGreaterThanOrEqual"); },
    inkey: function() { console.log("inkey"); },
    asc: function(c) {
      if (c.length > 0) {
        return c.charCodeAt(0);
      } else {
        throw "cannot calculate asc of empty string"
      }
    },
    chr: function(i) {
      if (typeof i != typeof 0) {
        throw ("chr argument not a number: " + i);
      }
      return String.fromCharCode(i);
    },
    instr: function(haystack, needle) {
      if (typeof haystack != typeof "") {
        throw ("instr haystack not a string: " + haystack);
      }
      if (typeof needle != typeof "") {
        throw ("instr needle not a string: " + needle);
      }
      return haystack.indexOf(needle) + 1;
    },
    int: function(v) {
      if (typeof v != typeof 0) {
        throw ("int arg not a number: " + v);
      }
      if (v < 0) {
        throw ("int doesn't properly handle negatives: " + v);
      }
      return Math.floor(v);
    },
    left: function(str, length) {
      if (typeof length != typeof 0) {
        throw ("length in left$ not a number: " + length);
      }
      return str.substring(0, length);
    },
    mid: function(str, start, length) {
      if (typeof start != typeof 0) {
        throw ("start in mid$ not a number: " + start);
      }
      if (typeof length != typeof 0) {
        throw ("length in mid$ not a number: " + length);
      }
      return str.substring(start - 1, start - 1 + length); // freaking 1 based indices
    },
    rnd: function(i) {
      if (typeof i != typeof 0) {
        throw ("rnd received non number: " + i);
      }
      return 1 + Math.floor(Math.random() * i);
    },
    str: function(i) {
      if (typeof i != typeof 0) {
        throw ("str$ received non number: " + i)
      }
      return "" + i;
    },
    string: function(count, num) {
      if (typeof count != typeof 0) {
        throw ("count in string$ is not a number: " + count);
      }
      if (typeof num != typeof 0) {
        throw ("char code in string$ is not a number: " + num);
      }
      var ret = "";
      for (var i = 0; i < num; i++) {
        ret = ret + String.fromCharCode(num);
      }
      return ret;
    },
    val: function(str) {
      if (typeof str != typeof "") {
        throw ("val arg is not a string: " + str);
      }
      return parseInt(str);
    }
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
    process(function(p) {
      p.noStroke();
    });
    pg = pr;
    next = st;
    setTimeout(step, 100);
  };
  return {
    run: run,
    quit: function() { quit = true; }
  };
})()
*/
