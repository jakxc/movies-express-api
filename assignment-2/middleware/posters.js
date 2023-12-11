const path = require("path");
const jwt = require('jsonwebtoken');
const { writeFile } = require("fs");

/**
 * Gets user property from token in request header
 *
 * @param {obj} req The request object
 */
const getUser = (req) => {  
    try {
      const token = req.headers.authorization.replace(/^Bearer /, "");
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const user = decodedToken["email"] || "";
  
      return user;
    } catch (e) {
      throw e;
    } 
  }

/**
 *Retrieves poster image of movie that matches imdbID from request url
 *
 * @param {obj} user Value of user property from token in request header
 * @param {obj} req The request object
 * @param {obj} res The response object
 * @param {obj} rnext Method to move to next middleware
 */
const getPosterById = (req, res, next) => {
    const options = {
        root: path.join(__dirname, "../posters")
    };

    try {
        const user = getUser(req);
        const { imdbID } = req.params;
        const fileName = `/${imdbID}_${user}.png`

        if (!imdbID) {
            let error = new Error("You must provide an imdb ID!");
            error.status = 400;
            throw error;
        }
        res.sendFile(fileName, options, (e) => {
            if (e) {
                let error = new Error("Unable to retrieve poster for this movie!");
                next(error);
                return;
            } else {
                console.log("Sent " + fileName);
            }
        });
    } catch (e) {
        next(e);
    }
}

/**
 *Adds poster image to movie that matches imdbID from request url
 *
 * @param {obj} user Value of user property from token in request header
 * @param {obj} req The request object
 * @param {obj} res The response object
 * @param {obj} rnext Method to move to next middleware
 */
const addPosterToMovie = (req, res, next) => {
    try {
        const { imdbID } = req.params;
        const user = getUser(req);
    
        if (!imdbID) {
            let error = new Error("You must provide an imdb ID!");
            error.status = 400;
            throw error;
        }

        writeFile(`./posters/${imdbID}_${user}.png`, req.body, (e) => {
            if (e) {
                let error = new Error(e.message);
                error.status = 400;
                next(error);
                return;
            } else {
                return res.status(201).json({
                    "error": false,
                    "message": "Poster Uploaded Successfully"
                });
            }
        });
    } catch (e) {
        next(e);
    }
}

module.exports = {
    getPosterById: getPosterById,
    addPosterToMovie: addPosterToMovie
}