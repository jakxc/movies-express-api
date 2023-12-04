var path = require("path");

const fileSender = (req, res, next) => {
    const options = {
        root: path.join(__dirname, "../posters")
    };
 
    const params = req.params;
    res.sendFile(`/${params["imdbID"]}.png`, options, function (err) {
        if (err) {
            next(err);
        } else {
            console.log('Sent:', fileName);
            next();
        }
    });
}

module.exports = {
    fileSender: fileSender
}