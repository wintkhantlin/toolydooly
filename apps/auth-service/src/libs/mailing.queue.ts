import { connect, Channel, ChannelModel } from 'amqplib';

let channel: Channel | null = null;
let connection: ChannelModel | null = null;

export const connectToQueue = async (): Promise<Channel> => {
    if (channel) return channel;

    const { QUEUE_URL } = process.env;
    if (!QUEUE_URL) throw new Error("QUEUE_URL not found");

    connection = await connect(QUEUE_URL);
    const ch = await connection.createChannel();

    await ch.assertQueue("mailing_queue", {
        durable: false,
        autoDelete: true,
    });

    connection.on('close', () => {
        channel = null;
        connection = null;
    });

    connection.on('error', () => {
        channel = null;
        connection = null;
    });

    channel = ch;
    return channel;
};
