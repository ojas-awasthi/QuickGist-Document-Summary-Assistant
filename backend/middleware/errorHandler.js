
export default function errorHandler(err, req, res, next) {
  console.error(err?.stack || err);
  const message = err?.message || 'Internal server error';
  res.status(err?.status || 500).json({ error: message });
}
