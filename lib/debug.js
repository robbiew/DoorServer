const ansi = require("ansi-escape-sequences");
const config = require("../config");
const ConnectionManager = require("./connection_manager");
const util = require("util");

class Debug {
  constructor(wrapper) {
    this.wrapper = wrapper;
    this.inputMode = "char";
    this.mode = "main";
    this.monitorMode = "command";
    this.localEcho = true;

    this.currentCategory = null; // Current category for navigation
    this.categories = [...new Set(config.doors.map((d) => d.category))]; // Unique categories
  }

  render() {
    if (this.mode === "main") {
      this.wrapper.clearScreen();
      let out = `\n\r${ansi.styles(["green", "bold"])}DoorNode ${ansi.styles([
        "normal",
        "green",
      ])}debug interface\n\r`;
      out += `${ansi.styles(["normal", "magenta"])}Username: ${ansi.styles([
        "bold",
        "magenta",
      ])}${this.wrapper.user.name}\n\r\n\r`;
      out += `${ansi.styles(["normal", "cyan"])}[${ansi.styles([
        "bold",
        "cyan",
      ])}M${ansi.styles(["normal", "cyan"])}]onitor Connections\n\r`;
      out += `${ansi.styles(["normal", "cyan"])}[${ansi.styles([
        "bold",
        "cyan",
      ])}R${ansi.styles(["normal", "cyan"])}]un Door\n\r`;
      out += `${ansi.styles(["normal", "cyan"])}[${ansi.styles([
        "bold",
        "cyan",
      ])}S${ansi.styles(["normal", "cyan"])}]et Username\n\r`;
      out += `${ansi.styles(["normal", "cyan"])}[${ansi.styles([
        "bold",
        "cyan",
      ])}D${ansi.styles(["normal", "cyan"])}]isconnect\n\r`;
      out += `\n\r${ansi.styles(["reset"])}Command: ${ansi.styles([
        "bold",
        "cyan",
      ])}`;
      this.wrapper.write(out);
    }

    if (this.mode === "run") {
      this.wrapper.clearScreen();
      if (!this.currentCategory) {
        let out = `\n\r${ansi.styles([
          "normal",
          "cyan",
        ])}Select a Category or Exit:\n\r`;
        this.categories.forEach((category, index) => {
          out += `${ansi.styles(["bold", "cyan"])}[${index + 1}] ${ansi.styles([
            "normal",
            "cyan",
          ])}${category}\n\r`;
        });
        out += `${ansi.styles(["bold", "cyan"])}[X] Exit to Debug Menu\n\r`;
        out += `\n\r${ansi.styles([
          "reset",
        ])}Enter a number to select a category: ${ansi.styles([
          "bold",
          "cyan",
        ])}`;
        this.wrapper.write(out);
      } else {
        let doorsInCategory = config.doors.filter(
          (d) => d.category === this.currentCategory
        );
        let out = `\n\r${ansi.styles([
          "normal",
          "cyan",
        ])}Doors in Category: ${ansi.styles(["bold", "cyan"])}${
          this.currentCategory
        }\n\r`;
        doorsInCategory.forEach((door, index) => {
          out += `${ansi.styles(["bold", "cyan"])}[${index + 1}] ${ansi.styles([
            "normal",
            "cyan",
          ])}${door.gameTitle} (${door.code})\n\r`;
        });
        out += `${ansi.styles(["bold", "cyan"])}[B] Back to Categories\n\r`;
        out += `\n\r${ansi.styles([
          "reset",
        ])}Enter a number to run a door: ${ansi.styles(["bold", "cyan"])}`;
        this.wrapper.write(out);
      }
    }

    if (this.mode === "setuser") {
      this.wrapper.write(
        `\n\r\n\r${ansi.styles([
          "normal",
          "magenta",
        ])}Set username to: ${ansi.styles(["bold", "magenta"])}`
      );
    }

    if (this.mode === "monitor") {
      this.wrapper.clearScreen();
      const maxWidth = 80; // Set the max width for the screen
      const columnWidths = {
        node: 5,
        ip: 15,
        username: 20,
        module: 15,
        terminal: 15,
      };

      let out = `Connection Monitor\n\r\n\r`;

      const padOrTruncate = (str, length) => {
        if (str.length > length) return str.slice(0, length);
        return str.padEnd(length, " ");
      };

      const formatIP = (ip) => {
        if (ip.startsWith("::ffff:")) return ip.slice(7); // Remove IPv4-mapped prefix
        return ip;
      };

      out += util.format(
        `${ansi.styles(["bold", "magenta"])}%s | %s | %s | %s | %s\n\r`,
        padOrTruncate("Node", columnWidths.node),
        padOrTruncate("IP", columnWidths.ip),
        padOrTruncate("Username", columnWidths.username),
        padOrTruncate("Module", columnWidths.module),
        padOrTruncate("Terminal", columnWidths.terminal)
      );

      for (let wrapper of ConnectionManager.wrappers) {
        out += util.format(
          `${ansi.styles(["bold", "white"])}%s | %s | %s | %s | %s\n\r`,
          padOrTruncate(wrapper.node.toString(), columnWidths.node),
          padOrTruncate(formatIP(wrapper.remoteAddress), columnWidths.ip),
          padOrTruncate(wrapper.user.name, columnWidths.username),
          padOrTruncate(wrapper.user.module, columnWidths.module),
          padOrTruncate(wrapper.user.terminal, columnWidths.terminal)
        );
      }

      // out += "\r\n";
      out += `${ansi.styles(["normal", "cyan"])}E[${ansi.styles([
        "bold",
        "cyan",
      ])}X${ansi.styles(["normal", "cyan"])}]it `;
      out += `${ansi.styles(["normal", "cyan"])}[${ansi.styles([
        "bold",
        "cyan",
      ])}D${ansi.styles(["normal", "cyan"])}]isconnect `;
      out += `${ansi.styles(["normal", "cyan"])}[${ansi.styles([
        "bold",
        "cyan",
      ])}R${ansi.styles(["normal", "cyan"])}]efresh\n\r`;
      out += `${ansi.styles(["reset"])}\r\nCommand: ${ansi.styles([
        "bold",
        "cyan",
      ])}`;

      this.wrapper.write(out);
    }
  }

  input(data) {
    let cmd = data.trim();

    if (this.mode === "main") {
      if (cmd.toUpperCase() === "R") {
        this.inputMode = "line";
        this.mode = "run";
      } else if (cmd.toUpperCase() === "S") {
        this.inputMode = "line";
        this.mode = "setuser";
      } else if (cmd.toUpperCase() === "M") {
        this.mode = "monitor";
      } else if (cmd.toUpperCase() === "D") {
        this.wrapper.write(
          `\n\r\n\r${ansi.styles(["bold", "red"])}Goodbye...${ansi.styles([
            "reset",
          ])}\n\r\n\r`
        );
        ConnectionManager.close(this.wrapper);
        return;
      } else {
        this.wrapper.write(
          `\n\r\n\r${ansi.styles(["bold", "red"])}Invalid command\n\r`
        );
      }
      this.render();
      return;
    }

    if (this.mode === "monitor") {
      if (this.monitorMode === "command") {
        if (cmd.toUpperCase() === "X") {
          this.mode = "main";
        } else if (cmd.toUpperCase() === "D") {
          this.monitorMode = "disconnect";
          this.inputMode = "line";
        } else if (cmd.toUpperCase() === "R") {
          this.render();
          return;
        } else {
          this.wrapper.write(
            `\n\r${ansi.styles(["bold", "red"])}Invalid command\n\r`
          );
        }
        this.render();
        return;
      }

      if (this.monitorMode === "disconnect") {
        let wrapper = ConnectionManager.wrappers.find(
          (w) => w.node == parseInt(cmd, 10)
        );
        if (wrapper) {
          ConnectionManager.close(wrapper);
        }
        this.monitorMode = "command";
        this.inputMode = "char";
        this.render();
        return;
      }
    }

    if (this.mode === "run") {
      if (!this.currentCategory) {
        if (cmd.toUpperCase() === "X") {
          this.mode = "main";
          this.inputMode = "char";
          this.render();
          return;
        }

        let index = parseInt(cmd, 10) - 1;
        if (index >= 0 && index < this.categories.length) {
          this.currentCategory = this.categories[index];
          this.render();
        } else {
          this.wrapper.write(
            `\n\r\n\r${ansi.styles(["bold", "red"])}Invalid category\n\r`
          );
        }
      } else {
        if (cmd.toUpperCase() === "B") {
          this.currentCategory = null;
          this.render();
          return;
        }

        let doorsInCategory = config.doors.filter(
          (d) => d.category === this.currentCategory
        );
        let index = parseInt(cmd, 10) - 1;
        if (index >= 0 && index < doorsInCategory.length) {
          let door = doorsInCategory[index];
          this.wrapper.setModule(door.code, () => {
            // Ensure cleanup and return to debug menu
            this.wrapper.write(
              `\n\r${ansi.styles(["bold", "cyan"])}Exited ${door.gameTitle} (${
                door.code
              }). Returning to Debug Menu.\n\r`
            );
            this.mode = "main";
            this.inputMode = "char";
            this.render();
          });
        } else {
          this.wrapper.write(
            `\n\r\n\r${ansi.styles(["bold", "red"])}Invalid door\n\r`
          );
        }
      }
      return;
    }

    if (this.mode === "setuser") {
      if (!cmd || cmd.length < 3 || cmd.length > 30) {
        this.wrapper.write(
          `\n\r\n\r${ansi.styles(["bold", "red"])}Invalid name\n\r`
        );
      } else {
        this.wrapper.user.name = cmd;
        this.wrapper.write(
          `\n\r\n\r${ansi.styles(["bold", "magenta"])}Name set to ${cmd}\n\r`
        );
      }

      this.mode = "main";
      this.inputMode = "char";
      this.render();
      return;
    }
  }

  destroy() {}
}

module.exports = Debug;

function pad(str, length) {
  return String(str).padEnd(length, " ");
}
