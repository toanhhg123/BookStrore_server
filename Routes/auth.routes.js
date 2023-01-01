import express from "express";
import passport from "passport";
import GoogleStrategy from "passport-google-oidc";
import dotenv from "dotenv";
import User from "../Models/UserModel.js";
import generateToken from "../utils/generateToken.js";

dotenv.config();
const router = express.Router();
passport.serializeUser(function (user, cb) {
  return cb(null, user);
});

passport.deserializeUser(function (user, cb) {
  return cb(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env["GOOGLE_CLIENT_ID"],
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
      callbackURL:
        "https://bshop-server.herokuapp.com/google/oauth2/redirect/google",
    },
    function verify(issuser, profile, cb) {
      return cb(null, profile);
    }
  )
);

router.get(
  "/login/federated/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/oauth2/redirect/google",
  passport.authenticate("google", {
    failureRedirect: "/google/login/faild",
    scope: ["email", "profile"],
  })
);

router.get("/login/success", async (req, res) => {
  if (req.user) {
    const { id, displayName, emails } = req.user;
    const email = emails[0]["value"];
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.json({
        _id: userExists._id,
        name: userExists.name,
        email: userExists.email,
        isAdmin: userExists.isAdmin,
        token: generateToken(userExists._id),
        createdAt: userExists.createdAt,
        user: req.user,
      });
    }
    const user = await User.create({
      name: displayName,
      email,
      password: id,
    });

    if (user) {
      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
        user: req.user,
      });
    }
  }
  return res.status(400).json({ message: "Login faild" });
});

router.get("/login/faild", (req, res) => {
  return res.status(400).json({ message: "Login faild" });
});
router.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.json({ message: "logout success" });
  });
});
export default router;
