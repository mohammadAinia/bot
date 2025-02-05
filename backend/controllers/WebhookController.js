const VERIFY_TOKEN = "Mohammad";  // This should be declared inside the controller file or passed from another module.

export const verifyWebhook = (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token === VERIFY_TOKEN) {
        console.log("✅ Webhook verified successfully.");
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
};
