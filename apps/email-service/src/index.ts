import { connect } from 'amqplib';
import { createTransport } from 'nodemailer';
import { mailingQueueSchema } from '@toolydooly/validation-schemas/mailing';
import resetPasswordTemplate from './templates/reset-password-template';

async function bootstrap() {
    const { QUEUE_URL, FRONTEND_URL } = process.env;
    if (!QUEUE_URL) throw new Error("QUEUE_URL environment variable not found");
    if (!FRONTEND_URL) throw new Error("FRONTEND_URL environment variable not found")

    const connection = await connect(QUEUE_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue("mailing_queue", {
        durable: false,
        autoDelete: true,
    });

    const transporter = createTransport({
        host: "localhost",
        port: 1025,
        ignoreTLS: true
    });

    channel.consume("mailing_queue", async (msg) => {
        if (!msg) return;
        const content = msg.content.toString();
        const parsed = await mailingQueueSchema.safeParseAsync(JSON.parse(content));

        if (!parsed.success) {
            console.error("Invalid message:", parsed.error);
            return;
        }

        await transporter.sendMail({
            to: parsed.data.payload.to,
            from: "no-reply@toolydooly.local",
            subject: "Reset Your Toolydooly Password",
            html: resetPasswordTemplate({ username: parsed.data.payload.username, url: new URL(`/auth/reset?id=${parsed.data.payload.session}`, process.env.FRONTEND_URL).toString() })
        });

        channel.ack(msg);
    });
}

bootstrap();
