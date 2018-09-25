'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const pageToken = "EAATIRqyUi3ABAAfZAkMbsAEZAfTRb6ZCtlwTDytsJxehcjIL2O40Hv88pSIOVF4wBFvpfQVIbPURPjI6lAg141tRZBLlGnoArhz0lSUrwW8NjF9IAskdCfKPOk0nl0NfsDuakEZA9MUB2dTHXJ9PxvLwUxdOpZC58mr0lZB4GTF1QZDZD"


app.set('port' , (process.env.PORT || 8080))

// process application /x-www-form-urlencoded 
app.use(bodyParser.urlencoded({extended: false}))

// process applcation/json 
app.use(bodyParser.json())

//Index route 

app.get('/' , function (req ,res){
    res.send('Hello world , I am a chat bot')
})



// for Facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})


//allowing the bot to speak 

app.post('/webhook/' , function (req, res){
    // parse the request body from the Post
    let body = req.body
    
    // check the webhook ebent is from a page subscription 
    
    if(body.object === 'page'){
    	
    	//Iterate over each entry - there may be multiple
    	body.entry.forEach(function (entry){
    		// get the webhook event . entry.messaging is an array , but 
    		// will only ever contain one event , so we get index 0 
    		
    		let webhook_event = entry.messaging[0]
    		console.log(webhook_event)
    		
    		// get the sender psid 
    		let sender_psid = webhook_event.sender.id
    		console.log('sender psid:' + sender_psid)
    		
    		//check if the event is a message or postback and pass the event to the appropriate handler function
    		
    		if (webhook_event.message) {
    			handleMessage(sender_psid , webhook_event.message)
    			
    		} else if((webhook_event.postback)) {
    			handlePostback(sender_psid , webhook_event.postback)
    		}
    	})
    	
    	//return a '200 OK' response to all events
    	res.status(200).send('EVENT_RECEIVED')
    }else{
    	// return a '404 not found' if event is not from a page subscription 
    	res.sendStatus(404)
    }
})

// Handles messages events 

function handleMessage(sender_psid , received_message){
	let response 
	
	// check if the message contains text 
	if(received_message.text){
		//create the payload for a basic text message 
		
		response = {
			"text": `You sent the message: "${received_message.text}". Now send me an image!`
		}
		
		
	}else if(received_message.attachments){
		//Gets the url of the message attachment
		
		let attachment_url = received_message.attachments[0].payload.url
		response = {
			"attachment": {
				"type": "template", 
				"payload": {
					"template_type": "generic",
					"elements": [{
						"title": "Is this the right picture?",
						"subtitle": "Tap a button to answer.",
						"image_url": attachment_url, 
						"buttons": [
							{
								"type": "postback", 
								"title": "Yes!",
								"payload": "yes",
							},{
								"type": "postback",
								"title": "No!",
								"payload": "no",
							}]
					}]
				}
			}
		}
	}
	
	// sends the response message
		callSendApi(sender_psid , response)
	
}

//handles messaging_postbacks events 

function handlePostback(sender_psid , received_postback) {
	let response 
	
	// get the payload for the postback 
	let payload = received_postback.payload
	
	// set the response based on the postback payload
	if(payload === 'yes'){
		response = {"text": "Thanks!"}
	}else if( payload === 'no'){
		response = {"text": "Oops , try sending another image "}
	}
	
	//Send the message to acknowledge the postback
	callSendApi(sender_psid , response)
	
}

function callSendApi(sender_psid , response){
	
	// Construct the message body 
	
	let request_body = {
		"recipient": {
			"id": sender_psid
		},
		"message": response
	}
	
	// send the http request to the messenger platform 
	
	request({
		"uri": "https://graph.facebook.com/v2.6/me/messages",
		"qs": {"access_token": pageToken}, 
		"method": "POST",
		"json": request_body
	}, (err , res , body) => {
		if(!err){
			console.log('message sent!')
		}else{
			console.error("Unable to send message:" + err)
		}
	})
}






