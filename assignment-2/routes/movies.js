const express = require("express");
const router = express.Router();
const { getMovieByTitle, getMovieById } = require("../middleware/movies.js")

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Movies' });
});


router.get("/search", getMovieByTitle);


router.get("/data/:imdbID?", getMovieById);


module.exports = router;