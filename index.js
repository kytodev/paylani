var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

// Server frontpage
app.get('/', function (req, res) {
    res.send('THIS IS PAYLANI');
});

// Facebook Webhook
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'testbot_verify_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});

// handler receiving messages
app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.message && event.message.text) {
            if (!payActions(event.sender.id, event.message.text)) {
                initialMessage(event.sender.id, {text: "Echo: " + event.message.text});
            }
        } else if (event.postback) {
            console.log("Postback received: " + JSON.stringify(event.postback));
        }
    }
    res.sendStatus(200);
});

// generic function sending messages
function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

// send rich message with kitten
function initialMessage(recipientId, text) {

    message = {
        "text":"How can I help?",
        "quick_replies":[
          {
            "content_type":"text",
            "title":"I failed a Payment",
            "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED"
          },
          {
            "content_type":"text",
            "title":"I need a receipt",
            "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN"
          },
          {
            "content_type":"text",
            "title":"Why was I charged?",
            "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN"
          },
          {
            "content_type":"text",
            "title":"Edit Payment Method",
            "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN"
          },
          {
            "content_type":"text",
            "title":"I have a coupon",
            "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN"
          }
        ]
    }

    sendMessage(recipientId, message);

    return true;
};

// action from advertiser
function payActions (recipientId, text) {
    text = text || "";

    var res = text.toLowerCase();

    if (res == 'i failed a payment') {
        var payMethod = "https://www.facebook.com/ads/manager/billing/payment_methods";

        message = {
            "attachment":{
              "type":"template",
              "payload":{
                "template_type":"button",
                "text":"If the payment method you're using to run ads on Facebook fails, you can try contacting your payment provider, bank, or financial institution for help.\n\nYou can also try adding a new payment method to your account by following the link below.",
                "buttons":[
                  {
                    "type":"web_url",
                    "url":payMethod,
                    "title":"Add a Payment Method"
                  }
                ]
              }
            }
        };


        sendMessage(recipientId, message);

        return true;
    } else if (res == 'i need a receipt') {
        sendMessage(recipientId, {text: "This worked for Need Receipt"});

        return true;
    } else if (res == 'why was i charged?') {
        sendMessage(recipientId, {text: "This worked for Payment Method"});

        return true;
    } else if (res == 'edit payment method') {
        var adsMan = "https://www.facebook.com/ads/manager";
        var payMethod = "https://www.facebook.com/ads/manager/billing/payment_methods";
        var billHist = "https://www.facebook.com/ads/manager/billing/transactions";

        message = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [
                    {
                        "title": "Add a payment method",
                        "subtitle": "Follow the link below, and click 'Add Payment Method' in the top right.",
                        "buttons": [
                            {
                            "type": "web_url",
                            "url": payMethod,
                            "title": "Payment Methods"
                            },
                            {
                            "type": "web_url",
                            "url": adsMan,
                            "title": "Ads Manager"
                            }
                        ]
                    },
                    {
                        "title": "Edit an existing payment method",
                        "subtitle": "Follow the link below, and edit your method.",
                        "buttons": [
                            {
                            "type": "web_url",
                            "url": payMethod,
                            "title": "Payment Methods"
                            },
                            {
                            "type": "web_url",
                            "url": adsMan,
                            "title": "Ads Manager"
                            }
                        ]
                    },
                    {
                        "title": "Remove a Payment Method",
                        "subtitle": "Follow the link below to find your method and remove it.",
                        "buttons": [
                            {
                            "type": "web_url",
                            "url": payMethod,
                            "title": "Payment Methods"
                            },
                            {
                            "type": "web_url",
                            "url": adsMan,
                            "title": "Ads Manager"
                            }
                        ]
                    }
                    ]
                }
            }
        };

        sendMessage(recipientId, message);

        return true;
    } else if (res == 'i have a coupon') {
        sendMessage(recipientId, {text: "This worked for Payment Method"});

        return true;
    } else if (res == 'start over') {
        initialMessage(recipientId, {text: "Echo: " + event.message.text});

        return true;
    }

    return false;
};