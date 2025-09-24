function formatName(name) {
  return name.trim().replace(/\b\w/g, (char) => char.toUpperCase());
}

module.exports = { formatName };