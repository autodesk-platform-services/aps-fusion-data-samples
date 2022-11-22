import MyApp from './app.js'; 
import MyAuth from './auth.js';

// Replace the string literal values with your own client id, client secret, 
// hub name, project name and component name. 
const clientId = '<YOUR_CLIENT_ID>';
const clientSecret = '<YOUR_CLIENT_SECRET>';
const hubName = '<YOUR_HUB_NAME>';
const projectName = '<YOUR_PROJECT_NAME>';
const componentName = '<YOUR_COMPONENT_NAME>';

// Create an instance of auth.js.
let myApsAuth = new MyAuth(clientId, clientSecret);

// Get an access token from your auth.js instance. 
let accessToken = await myApsAuth.getAccessToken(); 

// Create an instance of app.js using the variable set above. 
let myApsApp = new MyApp(
  accessToken
);

let info = await myApsApp.getModelHierarchy(
  hubName,
  projectName,
  componentName
);

if (info) {
  console.log("Model hierarchy:");
  printInfo(info.componentVersions, info.rootId, "");
} 


function printInfo (componentVersions, componentVersionId, indent) {
  console.log(indent + componentVersions[componentVersionId].name);
  for (let occurrence of componentVersions[componentVersionId].modelOccurrences.results) {
    printInfo(componentVersions, occurrence.componentVersion.id, indent + "  ");
  }
}
