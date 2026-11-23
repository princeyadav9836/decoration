const serverless = require('serverless-http');
const app = require('../../server');

const expressHandler = serverless(app);

/**
 * Netlify Serverless Handler for YUVI DECORATION Express App
 * Seamlessly bridges Netlify Serverless Functions with Express routes, MongoDB, & JSON fallback.
 */
module.exports.handler = async (event, context) => {
  // Prevent Lambda from hanging if database connection is kept alive
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  // Normalize request path so all /api/* routes map directly to Express endpoints
  let p = event.path || '';
  if (p.startsWith('/.netlify/functions/api')) {
    p = p.replace(/^\/\.netlify\/functions\/api/, '');
  }
  if (!p.startsWith('/api')) {
    p = '/api' + (p.startsWith('/') ? p : '/' + p);
  }
  event.path = p;

  return expressHandler(event, context);
};
