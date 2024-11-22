const ansi = require("ansi-escape-sequences");
const config = require("../config");
const Door = require("./door");
const Debug = require("./debug");

class Wrapper {
  constructor(conn, node, isDebugConnection = false) {
    this.socket = conn;
    this.node = node;
    this.remoteAddress = conn.remoteAddress;
    this.user = null;
    this.module = null;
    this.readyForInput = true;
    this.inputBuffer = "";
    this.inputQueue = [];
    this.isDebugConnection = isDebugConnection; // Initialize correctly
  }



  setModule(code, callback) {
    if (!code) {
      this.module = null;
      if (callback) callback();
      return;
    }
  
    let doorConfig = config.doors.find((d) => d.code === code);
    if (!doorConfig) {
      throw new Error(`No door config found with code=${code}`);
    }
  
    this.module = new Door(doorConfig, this);
    this.module.render();
  
    // Remove any existing 'close' listeners to prevent overlaps
    this.socket.removeAllListeners("close");
  
    // Monitor door exit
    this.socket.on("close", () => {
      if (this.isDebugConnection) {
        // Return to the Debug module for debug connections
        this.setDebugModule();
      } else {
        // Disconnect for direct connections
        this.socket.end();
      }
  
      if (callback) callback();
    });
  }
  

  setDebugModule() {
    // set character mode, don't wait for enter
    this.write(
      String.fromCharCode(255) +
        String.fromCharCode(253) +
        String.fromCharCode(34),
      "ascii"
    );

    // turn off local echo
    this.write(
      String.fromCharCode(255) +
        String.fromCharCode(251) +
        String.fromCharCode(1),
      "ascii"
    );

    this.module = new Debug(this);
    this.module.render();
  }

  clearScreen() {
    // clear screen
    this.write(ansi.erase.display(2));
    // move cursor to 0,0
    this.write(ansi.cursor.position(1, 1));
  }

  resetLine() {
    const lineLength = this.module.promptLength + this.inputBuffer.length;
    const lines = Math.floor(lineLength / this.width);
    if (lines) {
      this.write(ansi.cursor.up(lines));
    }
    this.write(ansi.cursor.horizontalAbsolute(1));
    this.write(ansi.erase.display(0));
  }

  detectCursorPosition() {
    this.write("\x1b[6n");
  }

  fixCursorPosition() {
    if (this.cursor[1]) {
      this.cursor[1]--;
      if (this.cursor[1] < 0) {
        this.cursor[1] = this.width - 1;
        this.cursor[0]--;
      }
    }
  }

  write(str, encoding) {
    try {
      this.socket.write(str, encoding || "binary");
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = Wrapper;
