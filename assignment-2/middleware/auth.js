const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");

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

const handleRegister = (req, res, next) => {
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
    const queryUsers = req.db.from("users").select("*").where("email", "=", email);
    queryUsers.then(users => {
        if (users.length > 0) {
            let error = new Error("User already exists");
            error.status = 409;
            next(error);
            return;
        }

        // Insert user into DB
        const saltRounds = 10;
        const hash = bcrypt.hashSync(password, saltRounds);
        return req.db.from("users").insert({ email, hash });
    })
    .then(() => {
        res.status(201).json({ success: true, message: "User created" });
    });
}

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
      
      res.status(200).json({
        token,
        token_type: "Bearer",
        expires_in
      });
    });
};

const getUser = (error, req, res, next) => {
  if (error) {
    next(error);
    return;
  }
  
  const token = req.headers.authorization.replace(/^Bearer /, "");
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  const user = decodedToken["email"];

  next(user);
}

module.exports = {
    handleAuthorization: handleAuthorization,
    handleRegister: handleRegister,
    handleLogin: handleLogin,
    getUser: getUser
}