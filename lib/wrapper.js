const ansi = require("ansi-escape-sequences");
const config = require("../config");
const Door = require("./door");
const Debug = require("./debug");

class Wrapper {
  constructor(conn, node) {
    this.socket = conn;
    this.node = node;
    this.remoteAddress = conn.remoteAddress;
    this.user = null;
    this.module = null;
    this.readyForInput = true;
    this.inputBuffer = "";
    this.inputQueue = [];
  }

  setModule(code, callback) {
    if (!code) {
      // Clear the current module and call the callback if provided
      this.module = null;
      if (callback) callback();
      return;
    }

    let doorConfig = config.doors.find((d) => d.code === code);
    if (!doorConfig) {
      throw new Error(`No door config found with code=${code}`);
    }

    // Initialize the door module
    this.module = new Door(doorConfig, this);

    // Render the door and handle its exit
    this.module.render();

    // Monitor door exit and return to the debug menu
    this.socket.on("close", () => {
      // Transition back to the Debug module
      this.setDebugModule();

      // Call the callback if provided
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
