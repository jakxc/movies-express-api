var path = require("path");
var { writeFile } = require("fs");

/**
 *Retrieves poster image of movie that matches imdbID from request url
 *
 * @param {obj} user Value of user property from token in request header
 * @param {obj} req The request object
 * @param {obj} res The response object
 * @param {obj} rnext Method to move to next middleware
 */
const getPosterById = (user, req, res, next) => {
    const options = {
        root: path.join(__dirname, "../posters")
    };

    // const user = getUser(req, res, next);
    const { imdbID } = req.params;
    const fileName = `/${imdbID}_${user}.png`

    return res.sendFile(fileName, options, (e) => {
        if (e) {
            let error = new Error("Unable to retrieve poster for this movie!");
            error.statusCode = 400;
            next(error);
            return;
        } else {
            console.log("Sent " + fileName);
        }
    });
}

/**
 *Adds poster image to movie that matches imdbID from request url
 *
 * @param {obj} user Value of user property from token in request header
 * @param {obj} req The request object
 * @param {obj} res The response object
 * @param {obj} rnext Method to move to next middleware
 */
const addPosterToMovie = (user, req, res, next) => {
    const { imdbID } = req.params;
    // const user = getUser(req, res, next);

    if (!imdbID) {
        let error = new Error("You must provide an imdb ID!");
        error.statusCode = 400;
        next(error);
        return;
    }

    try {
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
        let error = new Error(e.message);
        error.status = 500;
        next(error);
    }
}

module.exports = {
    getPosterById: getPosterById,
    addPosterToMovie: addPosterToMovie
}