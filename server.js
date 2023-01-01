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

// trust proxy (https://stackoverflow.com/questions/64958647/express-not-sending-cross-domain-cookies)
app.set("trust proxy", 1);

app.use(
  session({
    secret: "abc_123",
    cookie: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 60000000,
      secure: process.env.NODE_ENV === "production",
    },
    resave: true,
    saveUninitialized: false,
    ttl: 60 * 60 * 24 * 30,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ...

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
