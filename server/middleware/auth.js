const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET).id;
    next();
  } catch { res.status(401).json({ message: 'Please log in again' }); }
};
