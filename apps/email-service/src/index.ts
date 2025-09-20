import { connect } from 'amqplib';
import { createTransport } from 'nodemailer';
import { mailingQueueSchema } from '@toolydooly/validation-schemas/mailing';

async function bootstrap() {
    const { QUEUE_URL } = process.env;
    if (!QUEUE_URL) throw new Error("QUEUE_URL environment not found");

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
            html: `
    <div>
        <h2 style="color: #007bff;">Toolydooly Password Reset</h2>
        <p>Hi there,</p>
        <p>We received a request to reset your password. Click the button below to proceed:</p>
        <a href="${parsed.data.payload.session}" style="display: inline-block; padding: 12px 20px; margin: 15px 0; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
        <p>If you didn’t request this, you can safely ignore this email.</p>
    </div>
    `
        });

        channel.ack(msg);
    });
}

bootstrap();
