var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var { errorLogger, errorResponder, invalidPathHandler } = require("./middleware/errorHandler.js");
var { fileSender } = require("./middleware/fileHandler.js");

const options = require("./knexfile.js");
const knex = require("knex")(options);
const cors = require('cors');

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var moviesRouter = require("./routes/movies");
var postersRouter = require("./routes/posters.js");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(__dirname+"posters"));

app.use((req, res, next) => {
    req.db = knex;
    next();
});

app.use("/posters/:imdbID", fileSender);

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/movies", moviesRouter);
app.use("/posters", postersRouter);

app.get("/knex", function (req, res, next) {
    req.db
    .raw("SELECT VERSION()")
    .then((version) => console.log(version[0][0]))
    .catch((err) => {
    console.log(err);
    throw err;
    });

    res.send("Version Logged successfully");
});


// Console logs the error
app.use(errorLogger);

// Responses with error status code and object
app.use(errorResponder);

// Responses with error status code for invalid routes
app.use(invalidPathHandler);

// // catch 404 and forward to error handler
// app.use(function (req, res, next) {
// next(createError(404));
// });


// // error handler
// app.use(function (err, req, res, next) {

// // set locals, only providing error in development
// res.locals.message = err.message;
// res.locals.error = req.app.get("env") === "development" ? err : {};

// // render the error page
// res.status(err.status || 500);
// res.render("error");
// });

module.exports = app;