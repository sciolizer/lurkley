declare var basic_common;
var drawStr = function(drawing, s) {
  return function(p) {
    var segment = /(B?M[0-9]+,[0-9]+|B?U[0-9]+|B?D[0-9]+|B?L[0-9]+|B?R[0-9]+|B?E[0-9]+|B?F[0-9]+|B?G[0-9]+|B?H[0-9]+|S[0-9]+|C[0-9]+);?|/g
    var match;
    while (match = segment.exec(s)) {
      var text = match[0];
      var blank;
      if (text[0] == "B") {
        blank = true;
        text = text.slice(1);
      } else {
        blank = false;
      }
      var xdirection = 0;
      var ydirection = 0;
      var distance = parseInt(text.slice(1));
      var move = true;
      switch (text[0]) {
        case "U":
          ydirection = -1;
          break;
        case "D":
          ydirection = 1;
          break;
        case "L":
          xdirection = -1;
          break;
        case "R":
          xdirection = 1;
          break;
        case "E":
          ydirection = -1; xdirection = 1;
          break;
        case "F":
          ydirection = 1; xdirection = 1;
          break;
        case "G":
          ydirection = 1; xdirection = -1;
          break;
        case "H":
          ydirection = -1; xdirection = -1;
          break;
        case "S":
          move = false;
          throw "scale not implemented for draw";
          break;
        case "C":
          move = false;
          drawing.foregroundColor = distance;
          break;
        case "M":
          // handled below
          break;
        default:
          throw ("draw can't handle: " + text[0] + " in " + s);
      }
      var newx;
      var newy;
      if (text[0] == "M") {
        var coords = text.slice(1).split(",")
        newx = parseInt(coords[0]);
        newy = parseInt(coords[1]);
      } else if (move) {
        newx = drawing.lastX + distance * xdirection;
        newy = drawing.lastY + distance * ydirection;
      }
      if (move) {
        if (!blank) {
          p.stroke.apply(p, basic_common.cocoColor(drawing.foregroundColor));
          p.fill.apply(p, basic_common.cocoColor(drawing.foregroundColor));
          p.line(drawing.lastX, drawing.lastY, newx, newy);
          // p.noStroke(); // maybe this has been the problem?
        }
        drawing.lastX = newx;
        drawing.lastY = newy;
      }
    }
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
