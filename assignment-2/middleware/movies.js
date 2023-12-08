/**
 *Retrieves data for movies that matches title, year and page parameters from request url
 *
 * @param {obj} req The request object
 * @param {obj} res The response object
 * @param {obj} rnext Method to move to next middleware
 */
const getMovieByTitle = async (req, res, next) => {
    const query = req.query;
    const title = query.title;
    const year = query.year;
    const page = query.page || 1;
    const limit = 100;
    const offset = (page - 1) * 100;
    const invalidQueries = Object.keys(query).filter(el => el !== "title" && el !== "year" && el !== "page"); 

    // console.log("Number of querues: " + Object.keys(query).length);
    if (invalidQueries.length) {
        let error = new Error(`Invalid query parameters: ${invalidQueries.join(", ")}. Query parameters are not permitted.`);
        error.status = 400;
        next(error);
        return;
    }

    if (!title) {
        let error = new Error("You must provide a title!");
        error.status = 400;
        next(error);
        return;
    }

    if (year && !parseInt(year)) {
        let error = new Error("Invalid year format. Format must be yyyy.");
        error.status = 400;
        next(error);
        return;
    }

    if (page && !parseInt(page)) {
        let error = new Error("Invalid page format!");
        error.status = 400;
        next(error);
        return;
    }

    try {
        const totalCount = await req.db("basics")
        .where((builder) => {
            if (title) {
                builder.where("primaryTitle", "like", `%${title}%`);
            }

            if (year) {
                builder.where("startYear", year);
            }
        })
        .count("tconst as count")
        .then(res => res.reduce((acc, curr) => acc + curr.count, 0));

        const pageResults = await req.db("basics")
        .where((builder) => {
            if (title) {
                builder.where("primaryTitle", "like", `%${title}%`);
            }

            if (year) {
                builder.where("startYear", year);
            }
        })
        .select("tconst", "primaryTitle", "startYear", "titleType")
        .offset(offset)
        .limit(limit)

        const mappedData = pageResults.map(row => {
            return {
                "Title": row["primaryTitle"],
                "Year": row["startYear"],
                "imdbId": row["tconst"],
                "Type": row["titleType"]
            }
        })

        const paginationData = {
            "total": totalCount,
            "lastPage": Math.ceil(totalCount / limit),
            "perPage": limit,
            "currentPage": page,
            "from": Math.min((page - 1) * limit, totalCount),
            "to": Math.min(page * limit, totalCount)
        }

        return res.json({ 
            data: mappedData,
            pagination: paginationData
        });
    } catch (e) {
        let error = new Error(e.message);
        error.status = 500;
        next(error);
    }
}

/**
 *Retrieves data for movie that matches imdbID from request url
 *
 * @param {obj} req The request object
 * @param {obj} res The response object
 * @param {obj} rnext Method to move to next middleware
 */
const getMovieById = async (req, res, next)  => {
    const { imdbID } = req.params;

    if (!imdbID) {
        let error = new Error("You must provide an imdb ID!");
        error.status = 400;
        next(error);
        return;
    }

    try {
        const combinedResults = await req.db("basics")
        .select("*")
        .where((builder) => {
            if (imdbID) {
                builder.where("tconst", "=", imdbID);
            }
        })
        .then((rows) => {
            const mappedData = rows.map(row => {
                return {
                    "Title": row["primaryTitle"],
                    "Year": row["startYear"],
                    "Runtime": row["runtimeMinutes"],
                    "Genre": row["genres"]
                }
            })

            return mappedData;
        })

        const basicsAndPrincipalsResults = await req.db("principals")
        .join("names", "principals.nconst", "=", "names.nconst")
        .select("principals.tconst", "names.primaryName", "principals.category")
        .where("principals.tconst", "=", imdbID)

        basicsAndPrincipalsResults.forEach(row => {
            const category = row["category"][0].toUpperCase() + row["category"].slice(1);
            combinedResults.map(el => {
                el[category] ?  el[category] += `,${row["primaryName"]}` 
                : el[category] = row["primaryName"];
            })
        })

        const ratingsResults = await req.db("ratings")
        .select("averageRating")
        .where("tconst", "=", imdbID);

        ratingsResults.forEach(row => {
            const rating = {
            "Source": "Internet Movie Database",
            "Value": `${row["averageRating"]}/10`
            }

            combinedResults.map(el => el["Ratings"] 
            ? el["Ratings"].push(rating) 
            : el["Ratings"] = [rating]);
        })

        return res.json(combinedResults);
    } catch (e) {
        let error = new Error(e.message);
        error.status = 500;
        next(error);
    }
}

module.exports = {
    getMovieByTitle: getMovieByTitle,
    getMovieById: getMovieById
}



