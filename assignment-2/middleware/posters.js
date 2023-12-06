var path = require("path");
var { writeFile } = require("fs");

const getPosterById = (req, res, next) => {
    const options = {
        root: path.join(__dirname, "../posters")
    };

    const params = req.params;
    const fileName = `/${params["imdbID"]}.png`

    res.sendFile(fileName, options, function (err) {
        if (err) {
            let error = new Error(err);
            error.statusCode = 400;
            req.error = error;
            next();
        } else {
            console.log("Sent " + fileName);
            next();
        }
    });
}

const addPosterToMovie = (req, res, next) => {
    const { imdbID } = req.params;

    if (!imdbID) {
        let error = new Error("You must provide an imdb ID!");
        error.statusCode = 400;
        next(error);
    }

    try {
        writeFile(`./posters/${imdbID}.png`, req.body, (err) => {
            if (err) {
                let error = new Error(err.message);
                error.statusCode = 400;
                next(error);
            } else {
                res.json({
                    "error": false,
                    "message": "Poster Uploaded Successfully"
                });
            }
        });
    } catch (err) {
        let error = new Error(err.message);
        error.statusCode = 500;
        next(error);
    }
}

module.exports = {
    getPosterById: getPosterById,
    addPosterToMovie: addPosterToMovie
}