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
      let error = new Error("Invalid year format. Format must be yyyy.");
      error.statusCode = 400;
      throw error;
    }

    if (page && !parseInt(page)) {
      let error = new Error("Invalid page format!");
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
      .catch((err) => {
        let error = new Error(err.message);
        error.statusCode = 500;
        throw error;
      });
});


router.get("/data/:imdbID?", function (req, res, next) {
  const imdbID = req.params.imdbID;

  if (!imdbID) {
    let error = new Error("You must provide an imdb ID!");
    error.statusCode = 400;
    throw error;
  }

  req.db
    .from("basics")
    .select("*")
    .where((builder) => {
      if (imdbID) {
        builder.where("tconst", "=", imdbID);
      }
    })
    .then((rows) => {
      const basicsData = rows.map(row => {
        return {
          "Title": row["primaryTitle"],
          "Year": row["startYear"],
          "Runtime": row["runtimeMinutes"],
          "Genre": row["genres"]
        }
      })

      return basicsData[0];
    })
    .then(basicsData => {
      return req.db
        .from("principals")
        .join("names", "principals.nconst", "=", "names.nconst")
        .select("tconst", "names.primaryName", "principals.category")
        .where("tconst", "=", imdbID)
        .then(rows => {
          rows.forEach(row => {
            const category = row["category"][0].toUpperCase() + row["category"].slice(1);
            basicsData[category] ?  basicsData[category] += `,${row["primaryName"]}` : basicsData[category] = row["primaryName"];
          })

          return basicsData;
        })
    })
    .then(basicsAndPrincipalsData => {
      return req.db
        .from("ratings")
        .select("averageRating")
        .where("tconst", "=", imdbID)
        .then(rows => {
          rows.forEach(row => {
            const rating = {
              "Source": "Internet Movie Database",
              "Value": `${row["averageRating"]}/10`
            }

            basicsAndPrincipalsData["Ratings"] 
            ? basicsAndPrincipalsData["Ratings"].push(rating) 
            :  basicsAndPrincipalsData["Ratings"] = [rating];
          })

          return basicsAndPrincipalsData;
        })
    })
    .then(combinedData => res.json(combinedData))
    .catch((err) => {
      let error = new Error(err.message);
      error.statusCode = 500;
      throw error;
    });
});


module.exports = router;