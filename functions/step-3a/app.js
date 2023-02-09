const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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

  /* Check to see if we've already processed this record */
    await collection.updateOne({_id: new ObjectId(event.mongoRecordId) }, {
      $set: {
        step3a: "success",
        step: 'step-3a',
        date: new Date().toISOString()
      }
    })

  /* Return some output */
  return {
    eventId: event.eventId,
    mongoRecordId: event.mongoRecordId,
    success: true,
  }

}