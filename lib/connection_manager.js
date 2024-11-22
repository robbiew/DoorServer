const Wrapper = require('./wrapper')

exports.wrappers = []

exports.close = function (wrapper) {
  exports.wrappers = exports.wrappers.filter(w => w != wrapper)
  if (wrapper.module) {
    wrapper.module.destroy()
  }
  if (wrapper.socket) {
    wrapper.socket.destroy()
  }
  console.log('Connection from ' + wrapper.remoteAddress + ' closed, ' + exports.wrappers.length + ' active connections')
}

exports.init = function (conn, isDebugConnection = false) {
  const wrapper = new Wrapper(conn, exports.wrappers.length + 1, isDebugConnection);
  exports.wrappers.push(wrapper);
  console.log(
    `New connection from ${wrapper.remoteAddress}, ${exports.wrappers.length} active connections (Debug: ${isDebugConnection})`
  );
  return wrapper;
};