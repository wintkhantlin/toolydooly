import { hash, compare } from "bcryptjs";
import * as userRepo from "./user.repostiory";
import * as cache from "./libs/cache";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./libs/jwt";
import { randomBytes } from "crypto";
import redisClient from "./libs/redis";
import { connectToQueue } from "./libs/mailing.queue";
import { loginAlertQueueSchema, mailingQueueSchema } from "@toolydooly/validation-schemas/mailing";
import { z } from "zod/mini";
import { JwtPayload } from "jsonwebtoken";

export const registerUser = async (username: string, email: string, password: string) => {
    const existing = await userRepo.findUserByIdentifier(email) || await userRepo.findUserByIdentifier(username);
    if (existing) throw new Error(existing.email === email ? "Email exists" : "Username exists");

    const hashedPassword = await hash(password, 12);
    const user = await userRepo.createUser({ username, email, password: hashedPassword });
    await cache.setCache(user.uid, { uid: user.uid, username: user.username, email: user.email });

    return { user, accessToken: signAccessToken(user.uid), refreshToken: signRefreshToken(user.uid) };
};

export const emitLoginAlertToMailingQueue = async ({ timestamp, to, user_info } : { timestamp: Date, to: string, user_info: string }) => {
    const channel = await connectToQueue()

    channel.sendToQueue("mailing_queue", Buffer.from(JSON.stringify({
        action: "login_alert",
        payload: {
            timestamp,
            to,
            user_info
        }
    } satisfies z.infer<typeof loginAlertQueueSchema>)));
}

export const loginUser = async (identifier: string, password: string) => {
    const user = await userRepo.findUserByIdentifier(identifier);
    if (!user) throw new Error("User not found");
    if (!(await compare(password, user.password))) throw new Error("Password mismatch");

    await cache.setCache(user.uid, { uid: user.uid, username: user.username, email: user.email });

    return {
        user: { uid: user.uid, username: user.username, email: user.email },
        accessToken: signAccessToken(user.uid),
        refreshToken: signRefreshToken(user.uid),
    };
};

export const refreshUserToken = async (token: string) => {
    const payload = verifyRefreshToken(token) as JwtPayload & { iat: string };
    if (!payload?.sub) throw new Error("Invalid refresh token");

    const userId = payload.sub.toString();
    let user = await cache.getCache(userId);
    if (!user) {
        const dbUser = await userRepo.findUserById(userId);
        if (!dbUser) throw new Error("User not found");

        user = {
            uid: dbUser.uid,
            username: dbUser.username,
            email: dbUser.email,
            password_changed_at: dbUser.password_changed_at,
        };
        await cache.setCache(userId, user, 15 * 60);
    }

    const tokenIssuedAt = new Date(payload.iat * 1000);
    if (user.password_changed_at && tokenIssuedAt < new Date(user.password_changed_at)) {
        throw new Error("Session invalidated due to password change");
    }

    return signAccessToken(user.uid);
};

export const generateSessionToken = (): string => randomBytes(32).toString("base64url");

export const createForgetPasswordSession = async (identifier: string) => {
    const user = await userRepo.findUserByIdentifier(identifier);
    if (!user) throw new Error("User not found");

    const session = generateSessionToken();
    await redisClient.set(`reset:${session}`, user.uid, { EX: 900 }); // 15 min expiry

    const channel = await connectToQueue();
    channel.sendToQueue(
        "mailing_queue",
        Buffer.from(JSON.stringify({
            action: "forget_password",
            payload: { session, to: user.email, username: user.username }
        } satisfies z.infer<typeof mailingQueueSchema>))
    );

    return true;
};

export const verifyResetPasswordSession = async (sessionId: string) => {
    return await redisClient.get(`reset:${sessionId}`);
};

export const terminateResetPasswordSession = async (sessionId: string) => {
    await redisClient.del(`reset:${sessionId}`);
};

export const resetPassword = async (sessionId: string, newPassword: string) => {
    const userId = await verifyResetPasswordSession(sessionId);
    if (!userId) throw new Error("Invalid or expired session");

    const hashedPassword = await hash(newPassword, 12);
    const user = await userRepo.updateUserPassword(userId, hashedPassword);

    await cache.setCache(user.uid, {
        uid: user.uid,
        username: user.username,
        email: user.email,
        password_changed_at: user.password_changed_at
    });

    await terminateResetPasswordSession(sessionId);

    return { success: true, accessToken: signAccessToken(user.uid) };
};
