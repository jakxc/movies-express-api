require('dotenv').config();

var express = require("express");
const { handleRegister, handleLogin } = require("../middleware/auth.js");
var router = express.Router();

router.post('/register', handleRegister);

/* POST user login */
router.post('/login', handleLogin);

module.exports = router;
