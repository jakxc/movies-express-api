// var { uploadPosterAsync } = require("../middleware/fileHandler")
var { writeFile } = require("fs");
var express = require("express");
var router = express.Router();
const bodyParser = require("body-parser");

/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Posters' });
// });

router.get("/:imdbID?", function (req, res, next) {
  const params = req.params

  if (Object.keys(params).length > 1) {
    const invalidParams = Object.keys(params).filter(el => el !== "imdbID").join(", ");
    let error = new Error(`Invalid query parameters: ${invalidParams}. Query parameters are not permitted.`);
    error.statusCode = 400;
    throw error;
  }

  if (!params.imdbID) {
    let error = new Error("You must provide an imdbID!");
    error.statusCode = 400;
    throw error;
  }

  res.send();
});


router.post("/add/:imdbID?",
    bodyParser.raw({type: ["image/jpeg", "image/png"], limit: "5mb"}),
    (req, res) => {
        const imdbID = req.params.imdbID;

        if (!imdbID) {
          let error = new Error("You must provide an imdb ID!");
          error.statusCode = 400;
          throw error;
        }

        try {
          // uploadPosterAsync(`./posters/${imdbID}.png`, req, res)

            writeFile(`./posters/${imdbID}.png`, req.body, (err) => {
              if (err) {
                let error = new Error(err.message);
                error.statusCode = 400;
                throw error;
              } else {
                res.status(200).json({
                    "error": false,
                    "message": "Poster Uploaded Successfully"
                });
              }
            });
        } catch (err) {
          let error = new Error(err.message);
          error.statusCode = 500;
          throw error;
        }
});


module.exports = router;