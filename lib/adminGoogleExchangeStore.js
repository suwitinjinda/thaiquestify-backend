/**
 * One-time exchange codes for admin web Google login.
 * Backend redirects with ?exchange=CODE; frontend redeems CODE for token+user.
 */
const store = new Map();
const TTL_MS = 60 * 1000; // 1 minute

function randomId() {
  return require('crypto').randomBytes(24).toString('hex');
}

function set(data) {
  const id = randomId();
  store.set(id, { ...data, ts: Date.now() });
  return id;
}

function get(id) {
  const entry = store.get(id);
  store.delete(id);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) return null;
  const { token, user, ts } = entry;
  return { token, user };
}

module.exports = { set, get };
