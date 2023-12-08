const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");

/**
 * Handles verification of Bearer authentication in request header
 *
 * @param {obj} req The request object
 * @param {obj} res The response object
 * @return {obj} next Method to move to next middleware
 */
const handleAuthorization = (req, res, next) => {
    if (!("authorization" in req.headers) || !req.headers.authorization.match(/^Bearer /)) {
        let error = new Error("Authorization header ('Bearer token') not found");
        error.status = 401;
        next(error);
        return;
    }

    const token = req.headers.authorization.replace(/^Bearer /, "");
    try {
        jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
        if (e.name === "TokenExpiredError") {
            let error = new Error("JWT token has expired");
            error.status = 401;
            next(error);
            return;
        } else {
            let error = new Error("Invalid JWT token");
            error.status = 401;
            next(error);
            return;
        }

        return;
    }

    next();
};

/**
 * Handles inserting new user emal and password hash into database
 *
 * @param {obj} req The request object
 * @param {obj} res The response object
 * @return {obj} next Method to move to next middleware
 */
const handleRegister = async (req, res, next) => {
    // Retrieve email and password from req.body
    const { email, password }  = req.body;

    // Verify body
    if (!email || !password) {
        let error = new Error("Request body incomplete - email and password needed");
        error.status = 400;
        next(error);
        return;
    }

    // Determine if user already exists in table
    const queryUsers = await req.db.from("users").select("*").where("email", "=", email);
    if (queryUsers.length > 0) {
            let error = new Error("User already exists");
            error.status = 409;
            next(error);
            return;
    } else {
        // Insert user into DB
        const saltRounds = 10;
        const hash = bcrypt.hashSync(password, saltRounds);
        req.db.from("users").insert({ email, hash })
        .then(() => {
          return res.status(201).json({ success: true, message: "User created" });
      });
    }
}

/**
 * Handles verification of user and generates bearer token on successful login
 *
 * @param {obj} req The request object
 * @param {obj} res The response object
 * @return {obj} next Method to move to next middleware
 */
const handleLogin = (req, res, next) => {  
  const { email, password } = req.body;

  // Verify body
  if (!email || !password) {
    const error = new Error("Request body incomplete - email and password needed");
    error.status = 400;
    next(error);
  }

  const queryUsers = req.db.from("users").select("*").where("email", "=", email);
  queryUsers
    .then(users => {
      if (users.length === 0) {
        const error = new Error("Incorrect email or password");
        error.status = 401;
        next(error);
        return;
      }

      // Compare password hashes
      const user = users[0];
      return bcrypt.compare(password, user.hash);
    })
    .then(match => {
      if (!match) {
        let error = new Error("Incorrect email or password");
        error.status = 401;
        next(error);
        return;
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
    });
};

/**
 * Gets user property from token in request header
 *
 * @param {obj} req The request object
 * @param {obj} res The response object
 * @return {obj} next Method to move to next middleware
 */
const getUser = (req, res, next) => {  
  const token = req.headers.authorization.replace(/^Bearer /, "");
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  const user = decodedToken["email"];
  
  if (!user) {
    let error = new Error("Unable to retrieve user");
    error.status = 500;
    next(error);
    return;
  }

  next(user);
}

module.exports = {
    handleAuthorization: handleAuthorization,
    handleRegister: handleRegister,
    handleLogin: handleLogin,
    getUser: getUser
}