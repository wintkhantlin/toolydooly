import { hash, compare } from 'bcryptjs';
import * as userRepo from './user.repostiory';
import * as cache from './libs/cache';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './libs/jwt';
import { randomBytes } from 'crypto';
import redisClient from './libs/redis';
import { connectToQueue } from './libs/mailing.queue';
import { mailingQueueSchema } from '@toolydooly/validation-schemas/mailing';
import { z } from 'zod/mini';

export const registerUser = async (username: string, email: string, password: string) => {
    const existing = await userRepo.findUserByIdentifier(email) || await userRepo.findUserByIdentifier(username);
    if (existing) throw new Error(existing.email === email ? "Email exists" : "Username exists");

    const hashedPassword = await hash(password, 12);
    const [user] = await userRepo.createUser({ username, email, password: hashedPassword });

    await cache.setCache(email, { uid: user.uid, username: user.username, email: user.email });

    const accessToken = signAccessToken(user.uid!);
    const refreshToken = signRefreshToken(user.uid!);
    return { user, accessToken, refreshToken };
};

export const loginUser = async (identifier: string, password: string) => {
    const user = await userRepo.findUserByIdentifier(identifier);
    if (!user) throw new Error("User not found");
    if (!(await compare(password, user.password))) throw new Error("Password Mismatch")

    await cache.setCache(identifier, { uid: user.uid, username: user.username, email: user.email });

    return {
        user: { uid: user.uid, username: user.username, email: user.email },
        accessToken: signAccessToken(user.uid!),
        refreshToken: signRefreshToken(user.uid!)
    };
};

export const refreshUserToken = async (token: string) => {
    const payload = verifyRefreshToken(token);
    if (!payload || !payload.sub) {
        throw new Error("Invalid refresh token");
    }

    const userId = payload.sub.toString();

    let user = await cache.getCache(userId);

    if (!user) {
        user = await userRepo.findUserById(userId);
        if (!user) throw new Error("User not found");

        await cache.setCache(user.email, {
            uid: user.uid,
            username: user.username,
            email: user.email
        });
    }

    const accessToken = signAccessToken(user.uid);

    return accessToken;
};

export const createForgetPasswordSession = async (identifier: string): Promise<boolean> => {
    const user = await userRepo.findUserByIdentifier(identifier);
    if (!user) throw new Error("User Not Found");

    const session = generateSessionToken();

    await redisClient.set(`reset:${session}`, user.uid, {
        EX: 900
    });

    const channel = await connectToQueue();

    const queueResponse = channel.sendToQueue(
        "mailing_queue",
        Buffer.from(
            JSON.stringify({
                action: "forget_password",
                payload: {
                    session,
                    to: user.email,
                    username: user.username
                }
            } satisfies z.infer<typeof mailingQueueSchema>)
        )
    );

    return queueResponse;
};

export const generateSessionToken = (): string => randomBytes(32).toString("base64url");
