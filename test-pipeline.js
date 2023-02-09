// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region
AWS.config.update({region: 'us-east-1'});

// Create CloudWatchEvents service object
var ebevents = new AWS.EventBridge({apiVersion: '2015-10-07'});

(async () => { // async function expression used as an IIFE

  const event = {
    eventId: process.argv[2],
  }
  var params = {
    Entries: [
      {
        EventBusName: 'ProcessingEventBus',
        Detail: JSON.stringify(event),
        DetailType: 'processingEvent',
        Source: 'api.processingEvent'
      }
    ]
  };

  const data = await ebevents.putEvents(params).promise();
  console.log(data);

})();
