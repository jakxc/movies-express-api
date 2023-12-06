// var { uploadPosterAsync } = require("../middleware/fileHandler")
var express = require("express");
const { getPosterById, addPosterToMovie } = require("../middleware/posters.js");
var router = express.Router();
const bodyParser = require("body-parser");

/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Posters' });
// });

router.get("/:imdbID?", getPosterById, (req, res, next) => {
  if (req.error) {
    throw req.error;
  }

  res.send();
});


router.post("/add/:imdbID?",
    bodyParser.raw({type: ["image/jpeg", "image/png"], limit: "5mb"}),
    addPosterToMovie,
    (req, res) => {
        if (req.error) {
          throw req.error;
        }

        res.send();
});


module.exports = router;