const { MongoClient, ServerApiVersion } = require('mongodb');

const aws = require('aws-sdk');
const secretsManager = new aws.SecretsManager({});


exports.lambdaHandler = async (event, context) => {
  console.log(event);
  console.log(context);
  /* Eventually would want to optimize this and have it outside the lambdaHandler for speed */
  const rawSecret = await secretsManager.getSecretValue({
    SecretId: process.env.SECRET_ARN,
  }).promise();
  const secret = JSON.parse(rawSecret.SecretString);

  const PASSWORD = secret.MONGO_PASSWORD;
  const USERNAME = secret.MONGO_USERNAME;
  const DOMAIN = secret.MONGO_DOMAIN;
  const uri = `mongodb+srv://${USERNAME}:${PASSWORD}@${DOMAIN}/?retryWrites=true&w=majority`;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

  const mongo = await client.connect(uri);
  const db = mongo.db('demo');
  const collection = db.collection('test');

  const payload = event.payload;
  /* Check to see if we've already processed this record */
  let mongoRecordId;
  let myEvent = await collection.findOne({id: payload.eventId}, {_id: 1});
  if (!myEvent){
    const result = await collection.insertOne({
      id: payload.eventId,
      step1: "success",
      sfnId: event.sfnId,
      step: 'step-1',
      date: new Date().toISOString(),
    });
    mongoRecordId = result.insertedId.toString();
  }
  else {
    /* Some logic here to determine if you want to continue or not */
    await collection.updateOne({_id: myEvent._id}, {
      $set: {
        sfnId: event.sfnId,
        step1: "success",
        step: 'step-1',
        date: new Date().toISOString()
      }
    })
    mongoRecordId = myEvent._id;
  }

  /* Return some output */
  return {
    eventId: payload.eventId,
    mongoRecordId,
    nextStep: myEvent ? "a" : "b"
  }

}