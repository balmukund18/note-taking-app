// Vercel entry point
import('./dist/server.js').then((module) => {
  module.default;
}).catch((error) => {
  console.error('Failed to load server:', error);
});

module.exports = async (req, res) => {
  try {
    const { default: app } = await import('./dist/server.js');
    return app(req, res);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
