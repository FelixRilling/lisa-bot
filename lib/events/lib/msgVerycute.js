"use strict";

const ID_CUTIE = "273221196001181697";
const LEGAL_TEXT = /not cute/gi;

const sendMessage = require("di-ngy/lib/events/lib/sendMessage");

module.exports = function (msg, app) {
    if (msg.author.id === ID_CUTIE) {
        const messageText = msg.content;
        const messageTextLower = messageText.toLowerCase();

        LEGAL_TEXT.forEach(text => {
            if (messageTextLower === text) {
                sendMessage(app, msg, ["very cute"]);
            }
        });
    }
};
