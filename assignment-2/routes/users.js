require('dotenv').config();

var express = require("express");
const { handleRegister, handleLogin } = require("../middleware/auth.js");
var router = express.Router();

router.post('/register', handleRegister, (error, req, res, next) => {
  if (error) {
    throw error;
  }

  res.send();
});

/* POST user login */
router.post('/login', handleLogin, function (error, req, res, next) {
  if (error) {
    throw error;
  }

  res.send();
});

module.exports = router;
