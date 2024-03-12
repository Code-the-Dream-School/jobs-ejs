const express = require("express");
require("express-async-errors");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");

const app = express();

app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));

// secret word handling
//let secretWord = "syzygy";
require("dotenv").config();
const session = require("express-session");

const MongoDBStore = require("connect-mongodb-session")(session);
let url;
if (process.env.NODE_ENV == "test") {
  url = process.env.MONGO_URI_TEST;
} else {
  url = process.env.MONGO_URI;
}

const store = new MongoDBStore({
  // may throw an error, which won't be caught
  uri: url,
  collection: "mySessions",
});
store.on("error", function (error) {
  console.log(error);
});
const session_parms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};
if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  session_parms.cookie.secure = true; // serve secure cookies
}
app.use(session(session_parms));
app.use((req, res, next) => {
  if (req.path == "/multiply") {
    res.set("Content-Type", "application/json");
  } else {
    res.set("Content-Type", "text/html");
  }
  next();
});
app.use(require("connect-flash")());
const passport = require("passport");
const passport_init = require("./passport/passport_init");
passport_init();
app.use(passport.initialize());
app.use(passport.session());
const cookieParser = require("cookie-parser");
const csrf = require("host-csrf");
app.use(cookieParser(process.env.SESSION_SECRET));
let csrf_development_mode = true;
if (app.get("env") === "production") {
  csrf_development_mode = false;
}
app.set("trust proxy", 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);
app.use(helmet());
app.use(xss());
const csrf_options = {
  development_mode: csrf_development_mode,
};
app.use(csrf(csrf_options));
app.use(require("./middleware/storeLocals"));
app.get("/", (req, res) => {
  res.render("index");
});
app.get("/multiply", (req, res) => {
  let result;
  try {
    result = req.query.first * req.query.second;
    if (result.isNaN) {
      result = "NaN";
    } else if (result == null) {
      result = "null";
    }
  } catch (err) {
    return res.json({ error: err.message });
  }
  res.json({ result: result });
});
sessionRoutes = require("./routes/sessionRoutes");
app.use("/session", sessionRoutes);
const secretWordRouter = require("./routes/secretWord");
const auth = require("./middleware/auth");
app.use("/secretWord", auth, secretWordRouter);
const jobRouter = require("./routes/jobs");
app.use("/jobs", auth, jobRouter);

app.use((req, res) => {
  res.set("Content-Type", "text/plain");
  res.status(404).send(`That page (${req.method} ${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send(err.message);
});

const port = process.env.PORT || 3000;
const start = () => {
  try {
    require("./db/connect")(url);
    return app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`),
    );
  } catch (error) {
    console.log(error);
  }
};

const server = start();

module.exports = { app, server };
