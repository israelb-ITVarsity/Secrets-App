import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import env from "dotenv";
import GoogleStrategy from "passport-google-oauth2";

const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/secrets", async (req, res) => {
  if (req.isAuthenticated()) {
    //res.render("secrets.ejs");

    //TODO: Update this to pull in the user secret to render in secrets.ejs
    try {
      const currentUser = req.user;
      const result = await db.query("SELECT secrets FROM users WHERE email = $1", [currentUser.email]);
      console.log(result.rows[0].secrets);
      const userSecret = result.rows[0].secrets;
      if(userSecret){
        res.render('secrets.ejs', {secret : userSecret});
      } else {
        res.render('secrets.ejs', {secret : "Jesus Christ is my hero."});
      }
    } catch (e) {
      console.log(e);
    }
  } else {
    res.redirect("/login");
  }
});

//TODO: Add a get route for the submit button
//Think about how the logic should work with authentication.
app.get("/submit", (req, res) => {
  if(req.isAuthenticated()){
    res.render("submit.ejs");
  } else {
    res.redirect("/login");
  }
});

app.get("/auth/google", passport.authenticate("google", {
  scope: ["profile", "email"]
}));

app.get("/auth/google/secrets", passport.authenticate("google", {
  successRedirect: "/secrets",
    failureRedirect: "/login"
}));

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      req.redirect("/login");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log("success");
            res.redirect("/secrets");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

//TODO: Create the post route for submit.
//Handle the submitted data and add it to the database
app.post("/submit", async (req, res) => {
  const userInput = req.body.secret;

  try {
    const currentUser = req.user;
    //console.log(currentUser);
    await db.query("UPDATE users SET secrets = $1 WHERE email = $2", [userInput, currentUser.email]);
    res.redirect("/secrets")
  } catch (e) {
    console.log(e);
  }
});

passport.use("local", 
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            //Error with password check
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              //Passed password check
              return cb(null, user);
            } else {
              //Did not pass password check
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  })
);

passport.use("google", new GoogleStrategy({
  clientID : process.env.GOOGLE_CLIENT_ID,
  clientSecret : process.env.GOOGLE_CLIENT_SECRET,
  callbackURL : "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
}, async (accessToken, refreshToken, profile, cb) => {

  try {
    console.log(profile);
    const result = await db.query("SELECT * FROM users WHERE email=$1", [profile.email]);
    if(result.rows.length === 0){
      const newUser = await db.query("INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *", [profile.email, "google"]);

      console.log("Google strategy triggered");
      console.log("Profile received:", profile);
      console.log("User added to DB:", newUser.rows[0]);
      console.log("Redirecting to /secrets...");

      return cb(null, newUser.rows[0]);
    } else {
      //Already existing user
      return cb(null, newUser.rows[0]);
    }
  } catch (e) {
      return cb(e);
  }
}));

passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
