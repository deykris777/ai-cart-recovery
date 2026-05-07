function formatMessage(level, message) {
  const time = new Date().toISOString().replace('T', ' ').substring(0, 19);
  return `[${time}] ${level}: ${message}`;
}

module.exports = {
  info: (msg) => console.log(formatMessage('INFO', msg)),
  warn: (msg) => console.warn(formatMessage('WARN', msg)),
  error: (msg) => console.error(formatMessage('ERROR', msg))
};
