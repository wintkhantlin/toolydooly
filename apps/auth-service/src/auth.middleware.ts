import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "./libs/jwt";
import * as cache from "./libs/cache";
import * as userRepo from "./user.repostiory";
import jwt, { JwtPayload } from "jsonwebtoken";

export default async function AuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(403).json({ message: "Forbidden", status: "error" });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token) as JwtPayload & { iat: string };
    
    if (!payload?.sub || !payload.iat) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    const userId = payload.sub.toString();

    let user = await cache.getCache(userId);
    if (!user) {
      const dbUser = await userRepo.findUserById(userId);
      if (!dbUser) return res.status(404).json({ success: false, message: "User not found" });

      user = {
        uid: dbUser.uid,
        username: dbUser.username,
        email: dbUser.email,
        created_at: dbUser.created_at,
        password_changed_at: dbUser.password_changed_at
      };
      await cache.setCache(userId, user, 60 * 15);
    }

    // Check if token was issued before password change
    const tokenIssuedAt = new Date(payload.iat * 1000);
    if (user.password_changed_at && tokenIssuedAt < new Date(user.password_changed_at)) {
      return res.status(401).json({ success: false, message: "Token expired due to password change" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}
