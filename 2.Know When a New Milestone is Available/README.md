# Know When a New Milestone is Available

## Setting up your test
In the **terminal** run this to install all the necessary components
```
npm i
``` 

You will need to set the value of `clientId` and `clientSecret` variables in `index.js` based on your **APS app**'s credentials and make sure that the `Callback URL` of the app is set to `http://localhost:3000/callback/oauth` as shown in the picture\
![Get 3-legged token](./readme/credentials.png)

You will also need to set the value of `hubName`, `projectName` and `componentName` variables. You can find them either in **Fusion Teams** web app, in **Fusion 360** or any other place that lets you navigate the contents of your **Autodesk** hubs and projects - including the **Fusion Data API** itself\
![Get version id](./readme/inputs.png)

Then start **ngrok** that will provide a publicly available URL that the **APS** webhook can send messages to, which then will be passed to your computer\
![ngrok](./readme/ngrok.gif)

As shown in the gif, you need to copy the relevant URL and set the value of `ngrokUrl` in `index.js` to that 

## Running the test
In a **terminal**, you can run the test with:
```
npm start
```
As instructed in the console, you'll need to open a web browser and navigate to http://localhost:3000 in order to log into your Autodesk account 

## Output
```
Open http://localhost:3000 in a web browser in order to log in with your Autodesk account!
Deleted webhook 75a2adac-622e-41a0-b560-8fdb4a5228bd
Created webhook c3bebb52-4224-45ff-ad5b-fd7353f824a6
Listening to the events on http://localhost:3000 => https://fc4d-86-2-185-49.ngrok.io/callback

Create a milestone in Fusion 360 and wait for the event to be listed here:
Received a notification with following content:
{
  "id": "fd3bd89e-201e-4824-867a-7543a3b47e73",
  "source": "urn:com.autodesk.forge:clientid:cF2pIBIYqEpzS0d1gEicgU0nR0acgrjG",
  "specversion": "1.0",
  "type": "autodesk.data.pim:milestone.created-1.0.0",
  "subject": "urn:autodesk.data.pim:component:Y29tcH5jby4xMDY5RUZIZ1FreWVUaExVLWg0M0RBfkhJeExwelBKdWpvcFRvc24zZVRtN2lfYWdhfn4",
  "time": "2022-05-09T16:00:17.287Z",
  "data": {
    "componentid": "Y29tcH5jby4xMDY5RUZIZ1FreWVUaExVLWg0M0RBfkhJeExwelBKdWpvcFRvc24zZVRtN2lfYWdhfn4",
    "milestonename": "Milestone V48",
    "eventtype": "MILESTONE_CREATED"
  },
  "dataschema": "https://aps.autodesk.com/schemas/pim-event-schema-v1.0.0.json",
  "traceparent": "00-5d062bba301551d19e86db826d135397-e440e5a6d791d97c-01"
}
```
Here is how you can  create a milestone in **Fusion 360**\
![Create milestone](./readme/SaveDialog.png)

## Workflow explanation

The workflow can be achieved following these steps:

1. Get the id of root component 
2. Subscribe to the MILESTONE_CREATED event on the specific component
3. Listen to the event

## Fusion Data API Query

In `app.js` file, the following GraphQL query creates the webhook that will notify you when a new milstone gets created

```
mutation CreateWebhook($componentId: ID!, $eventType: WebhookEventTypeEnum!, $callbackURL: String!) {
  createWebhook(webhook: {
    componentId: $componentId,
    eventType: $eventType,
    callbackURL: $callbackURL,
    expiresOn: "2022-10-12T07:20:50.52Z",
    secretToken: "12345678901234567890123456789012"
  }) {
    id
  }
}
```


-----------

Please refer to this page for more details: [Fusion Data API Docs](https://aps.autodesk.com/en/docs/fusiondata/v1/developers_guide/overview/)

