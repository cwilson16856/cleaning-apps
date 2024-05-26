const crypto = require('crypto');

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

function customCsrfMiddleware(req, res, next) {
  if (req.method === "GET") {
    if (!req.session.csrfToken) {
      req.session.csrfToken = generateToken();
      console.log("CSRF token generated and stored in session.");
    }
    res.locals.csrfToken = req.session.csrfToken;
    next();
  } else if (["POST", "PUT", "DELETE"].includes(req.method)) {
    const clientToken = req.body.csrfToken || req.query.csrfToken;
    const serverToken = req.session.csrfToken;

    if (!clientToken || !serverToken || clientToken !== serverToken) {
      console.error("CSRF token mismatch or missing. Client token:", clientToken, "Server token:", serverToken);
      return res.status(403).send('CSRF token mismatch.');
    }
    console.log("CSRF token validated successfully.");
    next();
  } else {
    next();
  }
}

module.exports = customCsrfMiddleware;