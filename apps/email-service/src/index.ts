import { connect } from 'amqplib';
import { createTransport } from 'nodemailer';
import { mailingQueueSchema } from '@toolydooly/validation-schemas/mailing';
import resetPasswordTemplate from './templates/reset-password-template';
import loginAlertTemplate from './templates/login-alert-template';

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
            channel.ack(msg);
            return;
        }

        const data = parsed.data;

        if (data.action === "forget_password") {
            await transporter.sendMail({
                to: data.payload.to,
                from: "no-reply@toolydooly.local",
                subject: "Reset Your Toolydooly Password",
                html: resetPasswordTemplate({
                    username: data.payload.username,
                    url: new URL(`/auth/reset?id=${data.payload.session}`, FRONTEND_URL).toString()
                })
            });
        } else if (data.action === "login_alert") {
            await transporter.sendMail({
                to: data.payload.to,
                from: "no-reply@toolydooly.local",
                subject: "Login Alert",
                html: loginAlertTemplate({
                    timestamp: data.payload.timestamp,
                    user_info: data.payload.user_info,
                    resetLink: new URL(`/auth/request-password-reset`, FRONTEND_URL).toString()
                })
            });
        }

        channel.ack(msg);
    });

}

bootstrap();
