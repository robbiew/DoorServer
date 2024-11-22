const child_process = require("child_process");
const net = require("net");
const fs = require("fs");
const config = require("../config");
const path = require("path"); // Import the path module
const ConnectionManager = require("./connection_manager");

const dropFileFormats = ["DoorSys", "DorInfo", "DoorFileSR"];

class Door {
  constructor(doorConfig, wrapper) {
    this.wrapper = wrapper;
    this.inputMode = "char";
    this.localEcho = false;

    if (!doorConfig.doorCmd) {
      throw new Error("doorCmd not specified");
    }

    if (!doorConfig.dropFileFormat) {
      throw new Error("dropFileFormat not specified");
    }

    if (dropFileFormats.indexOf(doorConfig.dropFileFormat) == -1) {
      throw new Error(
        doorConfig.dropFileFormat +
          " must be one of: " +
          dropFileFormats.toString()
      );
    }

    if (!doorConfig.multiNode && !doorConfig.dropFileDir) {
      throw new Error("multiNode or dropFileDir must be specified");
    }

    this.client = null;
    this.doorCmd = doorConfig.doorCmd;
    this.dropFileFormat = doorConfig.dropFileFormat;
    this.nodePort = config.dosbox.startPort + this.wrapper.node;

    if (doorConfig.multiNode) {
      this.dropFileDir = `${config.dosbox.drivePath}/nodes/node${this.wrapper.node}`;
      this.createNodeDir();
    } else {
      this.dropFileDir = `${config.dosbox.drivePath}${doorConfig.dropFileDir}`;
    }

    if (doorConfig.removeLockFile) {
      let lockFile = `${config.dosbox.drivePath}${doorConfig.removeLockFile}`;
      if (fs.existsSync(lockFile)) {
        fs.unlinkSync(lockFile);
      }
    }

    this.createDosboxConfig();
    this.doorConfig = doorConfig; // Store doorConfig for logging
  }

  createDosboxConfig() {
    console.log(`Using DOSBox path: ${config.dosbox.dosboxPath}`);
    console.log(`Using config path: ${config.dosbox.configPath}`);
    console.log(`Using drive path: ${config.dosbox.drivePath}`);
    const node = this.wrapper.node;
    const nodePort = 10000 + node;
    const configFile = `${config.dosbox.configPath}/dosbox.conf`;
    const nodeConfigFile = `${config.dosbox.configPath}/dosbox${node}.conf`;

    if (fs.existsSync(nodeConfigFile)) {
      return;
    }

    let content = fs.readFileSync(configFile);
    content = content.toString().replace("port:10000", `port:${nodePort}`);
    content += "\nSET NODE=" + node + "\n";
    fs.writeFileSync(nodeConfigFile, content);
  }

  createNodeDir() {
    if (!fs.existsSync(this.dropFileDir)) {
      fs.mkdirSync(this.dropFileDir);
    }
  }

  logLaunch() {
    const logDir = path.join(__dirname, "../log");
    const logFile = path.join(logDir, "doorserver.log");

    // Ensure the log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Log entry format
    const logEntry = `${new Date().toISOString()} | User: ${
      this.wrapper.user.name
    } | Title: ${this.doorConfig.gameTitle || "Unknown"} | Code: ${
      this.doorConfig.code
    }\n`;

    // Append the log entry
    try {
      fs.appendFileSync(logFile, logEntry, "utf8");
    } catch (err) {
      console.error(`Failed to write to log: ${err.message}`);
    }
  }

  createDoorSys() {
    const dropFile = this.dropFileDir + "/DOOR.SYS";
    let contents = "COM1:\r";
    contents += "38400\r";
    contents += "8\r";
    contents += this.wrapper.node + "\r";
    contents += "38400\r";
    contents += "Y\r";
    contents += "Y\r";
    contents += "Y\r";
    contents += "Y\r";
    contents += this.wrapper.user.name + "\r";
    contents += "DoorNode\r";
    contents += "123 123-1234\r";
    contents += "123 123-1234\r";
    contents += "PASSWORD\r";
    contents += "30\r";
    contents += "1\r";
    contents += "01/01/99\r";
    contents += "86400\r";
    contents += "1440\r";
    contents += "GR\r";
    contents += "23\r";
    contents += "Y\r";
    contents += "1,2,3,4,5,6,7\r";
    contents += "7\r";
    contents += "12/31/99\r";
    contents += this.wrapper.node + "\r";
    contents += "Y\r";
    contents += "0\r";
    contents += "0\r";
    contents += "0\r";
    contents += "999999\r";
    contents += "01/01/81\r";
    contents += "C:\\\r";
    contents += "C:\\\r";
    contents += "Sysop\r";
    contents += "Sysop\r";
    contents += "00:05\r";
    contents += "Y\r";
    contents += "Y\r";
    contents += "Y\r";
    contents += "14\r";
    contents += "999999\r";
    contents += "01/01/99\r";
    contents += "00:05\r";
    contents += "00:05\r";
    contents += "999\r";
    contents += "0\r";
    contents += "0\r";
    contents += "0\r";
    contents += "DoorNode user\r";
    contents += "0\r";
    contents += "0\r";
    fs.writeFileSync(dropFile, contents);
  }

  createDorInfo() {
    const dropFile = this.dropFileDir + "/DORINFO1.DEF";
    let contents = "DoorNode\r\n";
    contents += this.wrapper.user.name + "\r\n";
    contents += "Lastname\r\n";
    contents += "COM1\r\n";
    contents += "38400 BAUD,N,8,1\r\n";
    contents += "0\r\n";
    contents += this.wrapper.user.name + "\r\n";
    contents += "\r\n";
    contents += "123 Test Lane\r\n";
    contents += "1\r\n";
    contents += "30\r\n";
    contents += "32766\r\n";
    contents += "0\r\n";
    fs.writeFileSync(dropFile, contents);
  }

  createDoorFileSR() {
    const dropFile = this.dropFileDir + "/DOORFILE.SR";
    let contents = this.wrapper.user.name + "\r\n";
    contents += "1\r\n";
    contents += "0\r\n";
    contents += "23\r\n";
    contents += "38400\r\n";
    contents += "1\r\n";
    contents += "86400\r\n";
    contents += this.wrapper.user.name + "\r\n";
    fs.writeFileSync(dropFile, contents);
  }

  removeDropFile(fileName) {
    const dropFile = path.join(this.dropFileDir, fileName);
    try {
      if (fs.existsSync(dropFile)) {
        fs.unlinkSync(dropFile);
        console.log(`Successfully deleted drop file: ${dropFile}`);
      }
      // Silent if file does not exist
    } catch (err) {
      console.error(`Error removing drop file (${dropFile}): ${err.message}`);
    }
  }
  
  
  removeDoorSys() {
    this.removeDropFile("DOOR.SYS"); // Pass file name directly
  }
  
  removeDorInfo() {
    this.removeDropFile("DORINFO1.DEF"); // Pass file name directly
  }
  
  removeDoorFileSR() {
    this.removeDropFile("DOORFILE.SR"); // Pass file name directly
  }
  

  render() {
    this.wrapper.clearScreen();
  
    const createMethod = `create${this.dropFileFormat}`;
    const removeMethod = `remove${this.dropFileFormat}`;
  
    // Validate and create drop file
    if (typeof this[createMethod] !== "function") {
      console.error(`Invalid dropFileFormat: ${this.dropFileFormat}`);
      throw new Error(`Drop file creation method not found: ${createMethod}`);
    }
    this[createMethod]();
  
    // Log the door launch
    this.logLaunch();
  
    const opts = [
      `${config.dosbox.drivePath}/bin/exit.bat`,
      "-c",
      this.doorCmd,
      "-conf",
      `dosbox${this.wrapper.node}.conf`,
      "-exit",
    ];
  
    console.log(`Starting DOSBox with options: ${opts.join(" ")}`);
  
    this.process = child_process.spawn(config.dosbox.dosboxPath, opts, {
      cwd: config.dosbox.configPath,
      env: config.dosbox.headless ? { SDL_VIDEODRIVER: "dummy" } : {},
    });
  
    this.process.on("error", (err) => {
      console.error(`Failed to start DOSBox: ${err.message}`);
    });
  
    this.process.on("exit", (code, signal) => {
      console.log(`DOSBox exited with code ${code} and signal ${signal}`);
      
      const removeMethod = `remove${this.dropFileFormat}`;
    
      if (this.wrapper.isDebugConnection) {
        this.wrapper.setDebugModule();
      } else {
        this.wrapper.socket.end();
      }
    });
  
    // Retry connection logic
    let tries = 0;
    const maxTries = 30;
    const connectInterval = setInterval(() => {
      tries++;
      if (tries === 1) {
        console.log(`Waiting for DOSBox to initialize on port ${this.nodePort}...`);
      }
  
      if (tries > maxTries) {
        console.error(`Failed to connect to DOSBox on port ${this.nodePort} after ${maxTries} tries.`);
        clearInterval(connectInterval);
        ConnectionManager.close(this.wrapper);
        return;
      }
  
      this.client = net.connect({ port: this.nodePort });
      this.client.on("connect", () => {
        console.log(`Connected to DOSBox on port ${this.nodePort}`);
        clearInterval(connectInterval);
        this.client.setEncoding("binary");
        this.client.on("data", (data) => this.wrapper.write(data));
        this.client.on("close", () => {
          console.log(`Connection to DOSBox on port ${this.nodePort} closed.`);
          this.client = null;
          this[removeMethod]();
        });
      });
  
      this.client.on("error", (err) => {
        console.error(`Error connecting to DOSBox: ${err.message}`);
      });
    }, 1000); // Retry every second
  }
  

  input(input) {
    if (!this.client) {
      return;
    }
    this.client.write(input);
  }

  destroy() {
    if (this.client) {
      this.client.end();
      this.client = null; // Nullify reference
    }
    if (this.process && !this.process.killed) {
      try {
        this.process.kill();
      } catch (err) {
        console.error(`Failed to kill process: ${err.message}`);
      }
      this.process = null; // Nullify reference
    }
  }
}

module.exports = Door;
