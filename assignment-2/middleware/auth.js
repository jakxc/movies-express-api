const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");

/**
 * Handles verification of Bearer token
 *
 * @param {obj} token Bearer token to be verified
 */
const handleTokenVerification = (token) => {
  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    if (e.name === "TokenExpiredError") {
        let error = new Error("JWT token has expired");
        error.status = 401;
        throw error;
    } else {
        let error = new Error("Invalid JWT token");
        error.status = 401;
        throw error;
    }
  }
}

/**
 * Handles verification of Bearer authentication in request header
 *
 * @param {obj} req The request object
 * @param {obj} res The response object
 * @param {obj} next Method to move to next middleware
 */
const handleAuthorization = (req, res, next) => {
  try {
    if (!("authorization" in req.headers) || !req.headers.authorization.match(/^Bearer /)) {
      let error = new Error("Authorization header ('Bearer token') not found");
      error.status = 401;
      throw error;
    }

    const token = req.headers.authorization.replace(/^Bearer /, "");
    handleTokenVerification(token);
  } catch (e) {
    next(e);
    return;
  }

  next();
};

/**
 * Handles inserting new user emal and password hash into database
 *
 * @param {obj} req The request object
 * @param {obj} res The response object
 * @param {obj} next Method to move to next middleware
 */
const handleRegister = async (req, res, next) => {
  try {
    // Retrieve email and password from req.body
    const { email, password }  = req.body;

    // Verify body
    if (!email || !password) {
      let error = new Error("Request body incomplete - email and password needed");
      error.status = 400;
      throw error;
    }

  if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    let error = new Error("Invalid email format!");
    error.status = 400;
    throw error;
  }

    // Determine if user already exists in table
    const queryUsers = await req.db.from("users").select("*").where("email", "=", email);
    if (queryUsers.length > 0) {
            let error = new Error("User already exists");
            error.status = 409;
            throw error;
    } else {
        // Insert user into DB
        const saltRounds = 10;
        const hash = bcrypt.hashSync(password, saltRounds);
        req.db.from("users").insert({ email, hash })
        .then(() => {
          return res.status(201).json({ success: true, message: "User created" });
      });
    }
  } catch(e) {
    next(e);
  }
}

/**
 * Handles verification of user and generates bearer token on successful login
 *
 * @param {obj} req The request object
 * @param {obj} res The response object
 * @param {obj} next Method to move to next middleware
 */
const handleLogin = async (req, res, next) => {  
  try {
    const { email, password } = req.body;
    const user = queryUsers[0];
    const passwordMatch = bcrypt.compare(password, user.hash);

    // Verify body
    if (!email || !password) {
      const error = new Error("Request body incomplete - email and password needed");
      error.status = 400;
      throw error;
    }

    const queryUsers = await req.db.from("users").select("*").where("email", "=", email);
    if (queryUsers.length === 0) {
      const error = new Error("Incorrect email or password");
      error.status = 401;
      throw error;
    }

    if (!passwordMatch) {
      let error = new Error("Incorrect email or password");
      error.status = 401;
      throw error;
    }
    console.log("Passwords match");
    const expires_in = 60 * 60 * 24; // 24 hours
    const exp = Math.floor(Date.now() / 1000) + expires_in;
    const token = jwt.sign({ email, exp }, process.env.JWT_SECRET);
    
    return res.status(200).json({
      token,
      token_type: "Bearer",
      expires_in
    });
  } catch(e) {
    next(e);
  }
}

module.exports = {
    handleAuthorization: handleAuthorization,
    handleRegister: handleRegister,
    handleLogin: handleLogin,
}