const express = require("express");
const bodyParser = require("body-parser");
const { handleAuthorization } = require("../middleware/auth.js");
const { getPosterById, addPosterToMovie } = require("../middleware/posters.js");

const router = express.Router();

/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Posters' });
// });

router.get("/:imdbID?", handleAuthorization, getPosterById);

router.post("/add/:imdbID?",
  handleAuthorization,
  bodyParser.raw({type: ["image/jpeg", "image/png"], limit: "5mb"}),
  addPosterToMovie
);

module.exports = router;