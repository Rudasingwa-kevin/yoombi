import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

const expo = new Expo();

/**
 * Send a push notification to one or more Expo push tokens.
 * 
 * @param tokens Array of valid Expo push tokens
 * @param title Notification title
 * @param body Notification body
 * @param data Optional extra data payload
 */
export async function sendPushNotifications(
    tokens: string[],
    title: string,
    body: string,
    data?: any
) {
    const messages: ExpoPushMessage[] = [];

    for (const pushToken of tokens) {
        // Check that all your push tokens appear to be valid Expo push tokens
        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`[PUSH] Token ${pushToken} is not a valid Expo push token`);
            continue;
        }

        // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
        messages.push({
            to: pushToken,
            sound: 'default',
            title,
            body,
            data: data || {},
        });
    }

    // The Expo SDK combines messages into chunks for efficiency.
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    (async () => {
        // Send the chunks to the Expo push notification service. There are
        // number of ways this could fail, but for now we'll just log and move on.
        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log(`[PUSH] Successfully sent chunk of ${chunk.length} notifications`);
                tickets.push(...ticketChunk);
                // NOTE: If a ticket contains an error, the token might be invalid.
                // In a production app, you would want to remove those from your database.
            } catch (error) {
                console.error('[PUSH] Error sending chunk:', error);
            }
        }
    })();
}
