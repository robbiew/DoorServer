const net = require('net');
const ConnectionManager = require('./lib/connection_manager');
const InputHandler = require('./lib/input_handler');
const config = require('./config');

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err.stack || err);
});

process.on('unhandledRejection', reason => {
  console.error('Unhandled Rejection:', reason.stack || reason);
});

start();

async function start() {
  try {
    validateConfig();
    startServer();
    console.log(`DoorNode listening on port ${config.port}`);
    if (config.debugPort) {
      startDebugServer();
    }
  } catch (err) {
    console.error(err.stack || err);
    process.exit(1);
  }
}

function validateConfig() {
  if (!config.port) throw new Error('config.port not configured');
  if (!config.dosbox.dosboxPath) throw new Error('config.dosbox.dosboxPath not configured');
  if (!config.dosbox.configPath) throw new Error('config.dosbox.configPath not configured');
  if (!config.dosbox.drivePath) throw new Error('config.dosbox.drivePath not configured');
  if (!config.dosbox.startPort) throw new Error('config.dosbox.startPort not specified');
}

function startServer() {
  let server = net.createServer(conn => {
    conn.setEncoding('binary');

    // Pass isDebugConnection as false for regular connections
    let wrapper = ConnectionManager.init(conn, false);

    conn.on('end', () => {
      ConnectionManager.close(wrapper);
    });

    conn.on('data', async str => {
      await InputHandler.onData(wrapper, str);
    });
  });


}

function startDebugServer() {
  let server = net.createServer(conn => {
    conn.setEncoding('binary');

    // Pass isDebugConnection as true for debug connections
    let wrapper = ConnectionManager.init(conn, true);
    wrapper.user = {
      name: config.debugUser?.name || 'DebugUser',
      module: config.debugUser?.module || 'Debug',
      terminal: config.debugUser?.terminal || 'ansi',
    };

    wrapper.setDebugModule();

    conn.on('end', () => {
      ConnectionManager.close(wrapper);
    });

    conn.on('data', async str => {
      await InputHandler.onData(wrapper, str);
    });
  });

  server.listen(config.debugPort, () => {
    console.log(`Debug interface listening on port ${config.debugPort}`);
  });
}
