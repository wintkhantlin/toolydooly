import bodyParser from "body-parser";
import express, { type Express } from "express";
import morgan from "morgan";
import { createUser, forgetPassword, loginUser, logout, refresh, resetPasswordController, verify, verifyResetPasswordSession } from "./auth.controller";
import AuthMiddleware from "./auth.middleware";
import cookieParser from "cookie-parser";
import cors from "cors";
import rateLimit from "express-rate-limit";

const allowedOrigin = process.env.FRONTEND_URL;

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests, please try again later."
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many attempts, please try again later."
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many reset attempts, please try again later."
});

export const createServer = (): Express => {
  const app = express();
  app
    .disable("x-powered-by")
    .use(globalLimiter)
    .use(morgan("dev"))
    .use(cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigin === origin) callback(null, true);
        else callback(new Error("Not allowed by CORS"));
      },
      credentials: true
    }))
    .use(bodyParser.urlencoded({ extended: true }))
    .use(express.json())
    .use(cookieParser());

  app.post("/create-user", authLimiter, createUser);
  app.post("/login", authLimiter, loginUser);
  app.post("/forget-password", authLimiter, forgetPassword);
  app.get("/reset-password/:id", verifyResetPasswordSession);
  app.put("/reset-password", resetLimiter, resetPasswordController);
  app.get("/session", AuthMiddleware, verify);
  app.get("/refresh", authLimiter, refresh);
  app.get("/logout", authLimiter, logout);

  return app;
};
