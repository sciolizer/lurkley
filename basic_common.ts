declare var processingQueue;
declare var drawing;
var basic_common = (function() {
  return {
    boundCheck: function(str, val, min, max) {
      if (typeof val != typeof 0) {
        throw (str + " not a number")
      }
      if (val < min) {
        throw (str + " less than min of " + min + ": " + val);
      }
      if (val > max) {
        throw (str + " more than max of " + max + ": " + val);
      }
    },
    cocoColor: function(ii) {
      // console.log("cocoColor: " + ii);
      // console.log("drawing.colorset: " + drawing.colorset);
      var i = ii + (drawing.colorset % 2) * 4;
      if (i > 8) i = i - 4; // eh
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
        case 5: // white (buff)
          return [255, 255, 255];
        case 6: // cyan
          return [0, 255, 255];
        case 7: // magenta
          return [255, 0, 255];
        case 8: // orange
          return [255, 165, 0];
      }
      try {
        throw new Error();
      } catch (e) {
        console.log(e.stack);
      }
      throw ("unrecognized color: " + i);
    },
    process: function(f) {
      processingQueue.unshift(f);
    }
  };
})();
