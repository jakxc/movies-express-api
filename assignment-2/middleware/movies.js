/**
 *Retrieves data for movies that matches title, year and page parameters from request url
 *
 * @param {obj} req The request object
 * @param {obj} res The response object
 * @param {obj} next Method to move to next middleware
 */
const getMovieByTitle = async (req, res, next) => {
    try {
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
            throw error;
        }
    
        if (!title) {
            let error = new Error("You must provide a title!");
            error.status = 400;
            throw error;
        }
    
        if (year && !parseInt(year)) {
            let error = new Error("Invalid year format. Format must be yyyy.");
            error.status = 400;
            throw error;
        }
    
        if (page && !parseInt(page)) {
            let error = new Error("Invalid page format! Format must be a number");
            error.status = 400;
            throw error;
        }
        
        const countObj = await req.db("basics")
        .where((builder) => {
            if (title) {
                builder.where("primaryTitle", "like", `%${title}%`);
            }

            if (year) {
                builder.where("startYear", year);
            }
        })
        .count("tconst as count")

        const totalCount = countObj.map(el => el["count"]).reduce((acc, curr) => acc + curr, 0);

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
            "currentPage": parseInt(page),
            "from": Math.min((page - 1) * limit, totalCount),
            "to": Math.min(page * limit, totalCount),
            "prev": parseInt(page) <= 1 
            ? null
            : `http://localhost:3000/movies/search?title=${title}${year ? `&${year}` : ""}&page=${parseInt(page) - 1}`,
            "next": parseInt(page) >= Math.ceil(totalCount / limit) 
            ? null 
            : `http://localhost:3000/movies/search?title=${title}${year ? `&${year}` : ""}&page=${parseInt(page) + 1}`
        }

        return res.json({ 
            data: mappedData,
            pagination: paginationData
        });
    } catch (e) {
        next(e);
    }
}

/**
 *Retrieves data for movie that matches imdbID from request url
 *
 * @param {obj} req The request object
 * @param {obj} res The response object
 * @param {obj} next Method to move to next middleware
 */
const getMovieById = async (req, res, next)  => {
    try {
        const { imdbID } = req.params;
        const query = req.query;
        const invalidQueries = Object.keys(query); 
    
        if (!imdbID) {
            let error = new Error("You must provide an imdb ID!");
            error.status = 400;
            throw error;
        }
    
        // console.log("Number of querues: " + Object.keys(query).length);
        if (invalidQueries.length) {
            let error = new Error(`Invalid query parameters: ${invalidQueries.join(", ")}. Query parameters are not permitted.`);
            error.status = 400;
            throw error;
        }

        const basicsResults = await req.db("basics")
        .select("*")
        .where((builder) => {
            if (imdbID) {
                builder.where("tconst", "=", imdbID);
            }
        })

        const combinedResults = basicsResults.map(row => {
            return {
                "Title": row["primaryTitle"],
                "Year": row["startYear"],
                "Runtime": `${row["runtimeMinutes"]}${parseInt(row["runtimeMinutes"]) > 1 ? " mins" : " min" }`,
                "Genre": row["genres"]
            }
        })

        const basicsAndPrincipalsResults = await req.db("principals")
        .join("names", "principals.nconst", "=", "names.nconst")
        .select("principals.tconst", "names.primaryName", "principals.category")
        .where("principals.tconst", "=", imdbID)

        basicsAndPrincipalsResults.forEach(row => {
            let category = row["category"];
            switch (category) {
                case "actress":
                    category = "Actresses";
                    break;
                default:
                    category = row["category"][0].toUpperCase() + row["category"].slice(1) + "s";
                    break;
            }

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

        combinedResults.forEach(result => {
            return res.json(result);
        })
    } catch (e) {
        next(e);
    }
}

module.exports = {
    getMovieByTitle: getMovieByTitle,
    getMovieById: getMovieById
}



