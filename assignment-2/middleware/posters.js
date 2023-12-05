var path = require("path");

const getPosterById = (req, res, next) => {
    const options = {
        root: path.join(__dirname, "../posters")
    };

    const params = req.params;
    const fileName = `/${params["imdbID"]}.png`

    res.sendFile(fileName, options, function (err) {
        if (err) {
            next(err);
        } else {
            console.log("Sent " + fileName);
            next();
        }
    });
}

module.exports = {
    getPosterById: getPosterById
}