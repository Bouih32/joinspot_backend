const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
require("dotenv").config();

const port = process.env.PORT || 7856;
const cors = require("cors");

app.use(
  cors({
    origin: ["https://joinspot-frontend.vercel.app", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Set-Cookie"],
  })
);

app.disable("x-powered-by");

const helmet = require("helmet");
app.use(helmet());

const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);
app.use(cookieParser());
const activityRoutes = require("./routes/activityRoutes");
const userRoutes = require("./routes/userRoutes");
const postsRoutes = require("./routes/postsRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

app.use(express.json());
app.use("/activity", activityRoutes);
app.use("/user", userRoutes);
app.use("/posts", postsRoutes);
app.use("/category", categoryRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
