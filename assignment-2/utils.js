// Error handling Middleware function for logging the error message
const errorLogger = (error, request, response, next) => {
    console.log( `error ${error.message}`) 
    next(error) // calling next middleware
  }
  
  // Error handling Middleware function reads the error message 
  // and sends back a response in JSON format
  const errorResponder = (error, request, response, next) => {
    response.header("Content-Type", 'application/json')
      
    const status = error.status || 400
    response.status(status).json({error: true, message: error.message})
  }
  
  // Fallback Middleware function for returning 
  // 404 error for undefined paths
  const invalidPathHandler = (request, response, next) => {
    response.status(404);
    response.send("Route not found!");
  }

  const getNameById = (req, id) => {
    req.db
    .from("names")
    .select("*")
    .where("nconst", "=", id)
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
  }

module.exports = {
    errorLogger: errorLogger,
    errorResponder: errorResponder,
    invalidPathHandler: invalidPathHandler
}