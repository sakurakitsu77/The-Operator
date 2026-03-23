function log(...args) {
  console.log(new Date().toISOString(), '-', ...args);
}

function warn(...args) {
  console.warn(new Date().toISOString(), '-', ...args);
}

function error(...args) {
  console.error(new Date().toISOString(), '-', ...args);
}

module.exports = {
  log,
  warn,
  error
};
