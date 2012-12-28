declare var basic_common;
var drawStr = function(drawing, s) {
  return function(p) {
    var blank = false;
    var distance = 0;
    var color = false;
    var xdirection = 0;
    var ydirection = 0;
    var flushed = true;
    var flush = function() {
      // console.log("called flush() when flushed = " + flushed);
      if (flushed) return;
      if (color) {
        drawing.foregroundColor = distance;
      } else {
        p.stroke.apply(p, basic_common.cocoColor(drawing.foregroundColor));
        p.fill.apply(p, basic_common.cocoColor(drawing.foregroundColor));
        if (distance == 0) distance = 1;
        // console.log("else lastX: " + drawing.lastX);
        // console.log("else distance: " + distance);
        // console.log("else xdirection: " + xdirection);
        // if (xdirection != 0 && ydirection != 0) {
          // console.log("distance: " + distance);
          // console.log("xdirection: " + xdirection);
          // console.log("ydirection: " + ydirection);
        // }
        var newx = drawing.lastX + distance * xdirection;
        var newy = drawing.lastY + distance * ydirection;
        if (!blank) {
          // console.log("drawing a line!");
          // console.log("drawing.lastX: " + drawing.lastX);
          // console.log("drawing.lastY: " + drawing.lastY);
          // console.log("newx: " + newx);
          // console.log("newy: " + newy);
          p.line(drawing.lastX, drawing.lastY, newx, newy);
        } else {
          // console.log("blank move");
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
      // console.log("s[i] = " + s[i]);
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
          // console.log("coords: " + coords);
          if (!blank) {
            // console.log("non blank move");
            p.stroke.apply(p, basic_common.cocoColor(drawing.foregroundColor));
            p.fill.apply(p, basic_common.cocoColor(drawing.foregroundColor));
            p.line(drawing.lastX, drawing.lastY, coords[0], coords[1]);
          } else {
            // console.log("blank move");
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
          ydirection = -1; xdirection = -1;
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
          // console.log("old distance: " + distance);
          distance = 10 * distance + parseInt(s[i])
          // console.log("new distance: " + distance);
          break;
        default:
          throw ("draw can't handle: " + s[i] + " in " + s);
      }
    }
    flush();
  };
};
var debugDrawing = {
  foregroundColor: 1,
  backgroundColor: 0,
  mode: 3, // I think this determines resolution
  screen: "text", // "text" or "graphics"
  colorset: 0, // 0 or 1
  lastX: 0,
  lastY: 0
};
var drawDebug = function(s) {
  basic_common.process(function(p) {
    drawStr(debugDrawing, s)(p);
  });
};
