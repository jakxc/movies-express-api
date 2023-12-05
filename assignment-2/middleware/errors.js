// Error handling Middleware function for logging the error message
const errorLogger = (error, req, res, next) => {
    console.log(`error ${error.message}`) 
    next(error) // calling next middleware
  }
  
  // Error handling Middleware function reads the error message 
  // and sends back a response in JSON format
  const errorResponder = (error, req, res, next) => {
    res.header("Content-Type", 'application/json')
      
    const status = error.status || 400
    res.status(status).json({error: true, message: error.message})
  }
  
  // Fallback Middleware function for returning 
  // 404 error for undefined paths
  const invalidPathHandler = (req, res, next) => {
    res.status(404);
    res.send("Route not found!");
  }

module.exports = {
    errorLogger: errorLogger,
    errorResponder: errorResponder,
    invalidPathHandler: invalidPathHandler
}