var express = require("express");
const { handleAuthorization, getUser } = require("../middleware/auth.js");
const { getPosterById, addPosterToMovie } = require("../middleware/posters.js");
var router = express.Router();
const bodyParser = require("body-parser");

/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Posters' });
// });

router.get("/:imdbID?", handleAuthorization, getUser, getPosterById, (error, req, res, next) => {
  if (error) {
    throw error;
  }
});


router.post("/add/:imdbID?",
  handleAuthorization,
  bodyParser.raw({type: ["image/jpeg", "image/png"], limit: "5mb"}),
  getUser,
  addPosterToMovie,
  (error, req, res, next) => {
      if (error) {
        throw error;
      }
});


module.exports = router;