import bodyParser from "body-parser";
import express, { type Express } from "express";
import morgan from "morgan";
import { createUser, forgetPassword, loginUser, logout, refresh, resetPasswordController, verify, verifyResetPasswordSession } from "./auth.controller";
import AuthMiddleware from "./auth.middleware";
import cookieParser from "cookie-parser";
import cors from 'cors';

const allowedOrigins = ["http://localhost:4173", "http://localhost:5173"];

export const createServer = (): Express => {
  const app = express();
  app
    .disable("x-powered-by")
    .use(morgan("dev"))
    .use(cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) callback(null, true);
        else callback(new Error("Not allowed by CORS"));
      },
      credentials: true
    }))
    .use(bodyParser.urlencoded({ extended: true }))
    .use(express.json())
    .use(cookieParser());

  app.post("/create-user", createUser);
  app.post("/login", loginUser);
  app.post("/forget-password", forgetPassword);
  app.get("/reset-password/:id", verifyResetPasswordSession);
  app.put("/reset-password", resetPasswordController);
  app.get("/session", AuthMiddleware, verify);
  app.get("/refresh", refresh);
  app.get("/logout", logout);

  return app;
};
