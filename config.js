/**
 * This is the doorserver configuration file.  This file is for defining basic dosbox launch
 * configuration and setting up door modules.
 */

const path = require("path");
const fs = require("fs");
const Ajv = require("ajv");

const ajv = new Ajv();

const doorSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      code: { type: "string" },
      doorCmd: { type: "string" },
      dropFileFormat: { type: "string" },
      dropFileDir: { type: "string" },
      removeLockFile: { type: "string" },
      multiNode: { type: "boolean" },
      description: { type: "string" },
      category: { 
        type: "string", 
        enum: ["Strategy", "Role Playing Game", "Adventure", "Action", "Simulation"]
      },
      gameTitle: { type: "string" },
      yearCreated: { 
        type: "number", 
        minimum: 1980, 
        maximum: new Date().getFullYear() // Optional field with valid range
      }
    },
    required: ["code", "doorCmd", "dropFileFormat", "description", "category", "gameTitle"] // yearCreated is NOT required
  }
};


// Define the path to the external doors configuration file
const doorsConfigPath = path.join(__dirname, "doors.json");
let doors = [];

try {
  const rawData = fs.readFileSync(doorsConfigPath, "utf8");
  doors = JSON.parse(rawData);

  // Validate the loaded configuration
  if (!ajv.validate(doorSchema, doors)) {
    console.error(`Invalid doors configuration: ${ajv.errorsText(ajv.errors)}`);
    doors = []; // Set doors to an empty array if validation fails
  }
} catch (error) {
  console.error(`Failed to load doors configuration: ${error.message}`);
}

module.exports = {
  // Rlogin listen port
  port: 3513,

  // Use your terminal program to connect to this port and manually launch modules.
  debugPort: 3333,

  dosbox: {
    // the path to the dosbox executable
    dosboxPath: "/usr/bin/dosbox",

    // the path to the dosbox config files
    configPath: path.join(__dirname, "dosbox"),

    // the path to the dosbox drive
    drivePath: path.join(__dirname, "dosbox/drive"),

    // communication is done using a nullmodem serial port mapping in dosbox
    // define the startpoint port number. Actual port numbers will be:
    // startPort + nodeNumber

    startPort: 10000,

    // launch dosbox instances in 'headless' mode (no window)
    headless: true,
  },

  // Doors metadata loaded from external file
  doors,
};