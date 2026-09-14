function formatINR(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

module.exports = { formatINR };