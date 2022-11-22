import MyApp from './app.js'; 
import MyAuth from './auth.js';

// Replace the string literal values with your own client id, client secret, 
// hub name, project name, component name, and also set the property group name, 
// property values and operation. 
const clientId = '<YOUR_CLIENT_ID>';
const clientSecret = '<YOUR_CLIENT_SECRET>';
const hubName = '<YOUR_HUB_NAME>';
const projectName = '<YOUR_PROJECT_NAME>';
const componentName = '<YOUR_COMPONENT_NAME>';
const propertyGroupName = '<YOUR_GROUP_NAME>'; 
const properties = [
  { name: 'partNumber',  type: 'String',  value: 'MyPartNumber'},  
  { name: 'countBodies', type: 'Boolean', value: true} 
]
const operation = 'create' // 'create' or 'update' or 'delete' 

// Create an instance of auth.js.
let myApsAuth = new MyAuth(clientId, clientSecret);

// Get an access token from your auth.js instance. 
let accessToken = await myApsAuth.getAccessToken(); 

// Create an instance of app.js using the variable set above. 
let myApsApp = new MyApp(
  accessToken
);

await myApsApp.manageProperties(
  hubName,
  projectName,
  componentName,
  propertyGroupName,
  properties,
  operation
);