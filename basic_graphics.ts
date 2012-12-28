declare var drawStr;
declare var basic_common;
var PI = 3.14159265358;
var MAX_X = 511; // 255;
var MAX_Y = 384; // 192;
var replay = {
  history: []
};
var graphics = (function() {
  var drawing = {
    foregroundColor: 1,
    backgroundColor: 0,
    mode: 3, // I think this determines resolution
    screen: "text", // "text" or "graphics"
    colorset: 0, // 0 or 1
    lastX: 0,
    lastY: 0
  };
  var setColor = function(p, clr) {
    var c;
    if (typeof clr == typeof undefined) {
      c = drawing.foregroundColor;
    } else {
      drawing.foregroundColor = clr;
      c = clr;
    }
    p.stroke.apply(p, basic_common.cocoColor(c));
    p.noFill();
  };
  var psetPreset = function(which, p, colorCallback) {
    if (which == "pset") {
      setColor(p, drawing.foregroundColor);
      colorCallback(basic_common.cocoColor(drawing.foregroundColor));
    } else if (which == "preset") {
      var f = drawing.foregroundColor;
      setColor(p, drawing.backgroundColor);
      colorCallback(basic_common.cocoColor(drawing.backgroundColor));
      setColor(p, f);
    } else {
      throw ("unrecognized pset/preset: " + which);
    }
  };
  var ret = {
    circle: function(x, y, rad, clr, ratio, start, end) { // todo: fix defaults
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
      basic_common.process(function(p) {
        var c = clr;
        if (typeof clr == typeof undefined) {
          c = drawing.foregroundColor;
        }
        setColor(p, clr);
        p.arc(x, y, rad, ratio * rad, start * 2 * PI, end * 2 * PI);
      });
    },
    color: function(foreground, background) {
      basic_common.boundCheck("color foreground", foreground, 0, 8);
      basic_common.boundCheck("color background", background, 0, 8);
      basic_common.process(function(p) {
        setColor(p, foreground);
        drawing.backgroundColor = background;
      });
    },
    draw: function(s) {
      basic_common.process(function(p) {
        console.log("drawing: " + s);
        setColor(p, undefined);
        drawStr(drawing, s)(p);
      });
    },
    get: function(x, y, a1, a2, arrName) {
      console.log("get");
    },
    line: function(xorig, yorig, x2, y2, psetOrPreset, bf) {
      // console.log("line: " + xorig + ", " + yorig + ", " + x2 + ", " + y2 + ", " + psetOrPreset + ", " + bf);
      if (typeof xorig != typeof undefined) {
        basic_common.boundCheck("line xorig", xorig, 0, MAX_X);
      }
      if (typeof yorig != typeof undefined) {
        basic_common.boundCheck("line yorig", yorig, 0, MAX_Y);
      }
      basic_common.boundCheck("line x2", x2, 0, MAX_X);
      basic_common.boundCheck("line y2", y2, 0, MAX_Y);
      basic_common.process(function(p) {
        psetPreset(psetOrPreset, p, function(color) {
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
            p.line(x1, y1, x2, y2);
          } else if (bf == "b") {
            p.rect(x1, y1, x2 - x1, y2 - x1)
          } else if (bf == "bf") {
            p.fill.apply(p, color);
            p.rect(x1, y1, x2 - x1, y2 - x1)
          } else {
            throw ("line not implemented for bf: " + bf);
          }
          drawing.lastX = x2;
          drawing.lastY = y2;
        });
      });
    },
    lineTo: function(x2, y2, psetOrPreset, bf) {
      ret.line(undefined, undefined, x2, y2, psetOrPreset, bf);
    },
    paint: function(x, y, clr, a1) {
    // Ideas at http://stackoverflow.com/questions/2106995/how-can-i-perform-flood-fill-with-html-canvas
      console.log("paint");
    },
    pcls: function(color) {
      basic_common.process(function(p) {
        p.background.apply(p, basic_common.cocoColor(color));
      });
    },
    pmode: function(mode, a) {
      basic_common.process(function(p) {
        // a ignored
        drawing.mode = mode;
      });
    },
    pset: function(x,y,clr) {
      basic_common.process(function(p) {
        // console.log("pset");
        setColor(p, clr);
        p.point(x,y);
        drawing.lastX = x;
        drawing.lastY = y;
      });
    },
    put: function(x1,y1,x2,y2,arrName) {
      console.log("put");
    },
    screen: function(gort, colorset) {
      basic_common.process(function(p) {
        if (gort == 0) {
          drawing.screen = "text";
        } else if (gort == 1 || gort == 2 || gort == 3) { // todo
          drawing.screen = "graphics";
        } else {
          throw ("invalid screen mode: " + gort);
        }
        drawing.colorset = colorset;
      });
    }
  };
  var loggingDelegator = {};
  var insertItem = function(newListItem) {
    var ind = replay.history.length;
    var ul = document.getElementById("replay");
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.innerHTML = newListItem;
    a.onclick = function() {
      for (var i = 0; i <= ind; i++) {
        var w = replay.history[i];
        ret[w.method].apply(ret, w.args);
      }
    };
    li.appendChild(a);
    ul.appendChild(li);
  };
  for (var key in ret) {
    loggingDelegator[key] = (function(k) { return function() {
      var s = k + ": ";
      for (var i = 0; i < arguments.length; i++) {
        if (i > 0) s = s + ", ";
        s = s + arguments[i];
      }
      insertItem(s);
      replay.history.push({ method: k, args: arguments });
      return ret[k].apply(ret, arguments);
    };})(key);
  }
  return loggingDelegator;
})();
