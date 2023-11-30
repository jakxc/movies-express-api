var express = require("express");
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Movies' });
});

router.get("/search", function (req, res, next) {
    const title = req.query.title;
    const year = req.query.year; //either a value or undefined
    const page = req.query.page || 1;
    const limit = 100;
    const offset = (page - 1) * 100;

    if (!title) {
      let error = new Error("You must provide a title!");
      error.statusCode = 400;
      throw error;
    }

    if (year && !parseInt(year)) {
      let error = new Error("Invalid year format!");
      error.statusCode = 400;
      throw error;
    }
  
    req.db
      .from("basics")
      .select("tconst", "titleType", "primaryTitle", "startYear")
      .where((builder) => {
        if (title) {
          builder.where("primaryTitle", "like", `%${title}%`);
        }

        if (year) {
          builder.where("startYear", year);
        }
      })
      .orderBy("startYear")
      .offset(offset)
      .limit(limit)
      .then((rows) => {
        const mappedData = rows.map(row => {
          return {
            "Title": row["primaryTitle"],
            "Year": row["startYear"],
            "imdbId": row["tconst"],
            "Type": row["titleType"]
          }
        })

        const paginationData = {
          "total": rows.length,
          "lastPage": Math.ceil(rows.length / limit),
          "perPage": limit,
          "currentPage": page,
          "from": Math.min(offset * 100, rows.length),
          "to": Math.min((offset * 100) + 100, rows.length)
        }

        res.json({ 
          error: false, 
          Message: "Success", 
          data: mappedData,
          pagination: paginationData
        });
      })
      .catch((err) => res.status(500).json({ error: true, Message: 'Error in MySQL query' }));
});


router.get("/data/:imdbID", function (req, res, next) {
  const imdbID = req.params.imdbID;

  if (!imdbID) {
    let error = new Error("You must provide an imdb ID!");
    error.statusCode = 400;
    throw error;
  }

  req.db
    .from("basics", "crew", "names", "principals", "ratings")
    .select("*")
    .where((builder) => {
      if (imdbID) {
        builder.where("primaryTitle", "=", imdbID);
      }

      if (year) {
        builder.where("startYear", year);
      }
    })
    .orderBy("startYear")
    .offset(offset)
    .limit(limit)
    .then((rows) => {
      const mappedData = rows.map(row => {
        return {
          "Title": row["primaryTitle"],
          "Year": row["startYear"],
          "imdbId": row["tconst"],
          "Type": row["titleType"]
        }
      })

      const paginationData = {
        "total": rows.length,
        "lastPage": Math.ceil(rows.length / limit),
        "perPage": limit,
        "currentPage": page,
        "from": Math.min(offset * 100, rows.length),
        "to": Math.min((offset * 100) + 100, rows.length)
      }

      res.json({ 
        error: false, 
        Message: "Success", 
        data: mappedData,
        pagination: paginationData
      });
    })
    .catch((err) => res.status(500).json({ error: true, Message: 'Error in MySQL query' }));
});


module.exports = router;