const jwt = require('jsonwebtoken');
const key = require('../config/key');

exports.decodeToken = (token, callback) => {
  jwt.verify(token, key.tokenKey, (err, decoded) => {
    if (!err) {
      callback(decoded);
    } else {
      callback(false);
    }
  });
};
