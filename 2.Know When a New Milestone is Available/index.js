import MyApp from './app.js'; 
import MyAuth from './auth.js';

// Replace the string literal values with your own client id, client secret, 
// hub name, project name and component name. 
const clientId = '<YOUR_CLIENT_ID>';
const clientSecret = '<YOUR_CLIENT_SECRET>';
const hubName = '<YOUR_HUB_NAME>';
const projectName = '<YOUR_PROJECT_NAME>';
const componentName = '<YOUR_COMPONENT_NAME>';
const eventType = 'MILESTONE_CREATED';

// In a terminal, start ngrok with the following command: 
// ngrok http 3000 -host-header="localhost:3000" 
// Copy and paste ngrok URL value returned to your terminal console. 
const ngrokUrl = '<YOUR_NGROK_URL>';

// Create an instance of auth.js.
let myApsAuth = new MyAuth(clientId, clientSecret);

// Get an access token from your auth.js instance. 
let accessToken = await myApsAuth.getAccessToken();

var myApsApp = new MyApp(
  accessToken,
  ngrokUrl
);

await myApsApp.unsubscribeToEvent(eventType);

if (await myApsApp.subscribeToEvent(hubName, projectName, componentName, eventType)) {
  // Use the startMonitoringEvents method to report events to the console.
  await myApsApp.startMonitoringEvents();

  console.log("\nCreate a milestone in Fusion 360 and wait for the event to be listed here:")
}




