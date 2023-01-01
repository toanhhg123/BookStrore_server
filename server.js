import express from "express";
import dotenv from "dotenv";
import connectDatabase from "./config/MongoDb.js";
import ImportData from "./DataImport.js";
import productRoute from "./Routes/ProductRoutes.js";
import { errorHandler, notFound } from "./Middleware/Errors.js";
import userRouter from "./Routes/UserRoutes.js";
import orderRouter from "./Routes/orderRoutes.js";
import categorytRoute from "./Routes/CategoriesRoutes.js";
import auth from "./Routes/auth.routes.js";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import sqlLite from "connect-sqlite3";

//

dotenv.config();
connectDatabase();
const app = express();
app.use(express.json());
app.use(cors({ credentials: true, origin: process.env.CLIENT_HOST }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

var SQLiteStore = sqlLite(session);

app.use(
  session({
    secret: "asdas",
    resave: false,
    saveUninitialized: false,
    cookie: {
      // this is age for the cookie in milliseconds
      maxAge: 30 * 24 * 60 * 60 * 1000,

      // this is the key for the cookie
      keys: "asdasd",

      // An HttpOnly Cookie is a tag added to a browser cookie that prevents client-side scripts from accessing data.
      httpOnly: false,

      // Note: Standards related to the Cookie SameSite attribute recently changed such that:
      // The cookie-sending behavior if SameSite is not specified is SameSite=Lax. Previously the default was that cookies were sent for all requests.
      // Cookies with SameSite=None must now also specify the Secure attribute (they require a secure context/HTTPS).
      // Cookies from the same domain are no longer considered to be from the same site if sent using a different scheme (http: or https:).
      sameSite: "none",
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    store: new SQLiteStore({ db: "sessions.db", dir: "./var/db" }),
  })
);
app.use(passport.authenticate("session"));

// API
app.use("/api/import", ImportData);
app.use("/api/categories", categorytRoute);
app.use("/api/products", productRoute);
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
app.use("/google", auth);

app.get("/api/config/paypal", (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID);
});

// ERROR HANDLER
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 1000;

app.listen(PORT, console.log(`server run in port ${PORT}`));
