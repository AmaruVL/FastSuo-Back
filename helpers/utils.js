const jwt = require("jsonwebtoken");
const key = require("../config/key");
const models = require("../models");
const cache = require("../config/cache");

exports.decodeToken = (token, callback) => {
  jwt.verify(token, key.tokenKey, function (err, decoded) {
    if (!err) {
      callback(decoded);
    } else {
      callback(false);
    }
  });
};
