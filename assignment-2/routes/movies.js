var express = require("express");
var router = express.Router();
var { getMovieByTitle, getMovieById } = require("../middleware/movies.js")

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Movies' });
});


router.get("/search", getMovieByTitle, (req, res, next) => {
  if (req.error) {
    throw req.error;
  }
    // console.log("Getting movie by title");
  res.send();
});


router.get("/data/:imdbID?", getMovieById, (req, res, next) => {
  if (req.error) {
    throw req.error;
  }

    // console.log("Getting movie by title");
  res.send();
});


module.exports = router;