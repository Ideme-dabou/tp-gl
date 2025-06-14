var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const cors = require("cors");
const bodyParser = require("body-parser");

var authorize = require("./middleware/authorize.middleware");
var authenticate = require("./middleware/authenticate.middleware");

var secureRoute = require('./routes/secure.route');  // pour le module middleware
var vehicleRoute = require("./routes/vehicule.route");
var userRoute = require("./routes/user.route");
var sequelize = require("./config/db");
var app = express();

// Configuration CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'https://tp-gl-frontend.vercel.app'], // Permet toutes les origines
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use(cookieParser())
//Hello world example to test pull request

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

//swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// create database connection
sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
  });

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/vehicles", vehicleRoute);
app.use("/users", userRoute);
app.use('/', secureRoute);
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});


// Routes spéciales pour les tests d'intégration middleware
app.get('/secure', authenticate, (req, res) => {
  res.status(200).json({ message: 'Authenticated' });
});

app.get('/admin', authenticate, authorize(['admin']), (req, res) => {
  res.status(200).json({ message: 'Admin access' });
});

app.get('/whoami', authenticate, (req, res) => {
  res.status(200).json({ user: req.user });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));

});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});
/*
const PORT = process.env.PORT || 3001;
app.listen( () => {                                      ## isole pour le test d'integration du module middleware
  console.log(`Server is running on http://localhost:${PORT}`);
});
*/
module.exports = app;
