// Axios is a promise-based HTTP client for the browser and node.js. 
import axios from "axios";

// Express is a JavaSscript web application framework. 
import express from "express";

// Instantiate an express application 
let app = express();

// Use a json handler for incoming HTTP requests.
app.use(express.json());

// Application constructor 
export default class App {
  constructor(accessToken, ngrokUrl) {
    this.graphAPI = 'https://developer.api.autodesk.com/fusiondata/2022-04/graphql';
    this.accessToken = accessToken;
    this.port = 8080;
    this.callbackPath = '/callback';
    this.callbackUrl = ngrokUrl + this.callbackPath;
  }

  getRequestHeaders() {
    return {
      "Content-type": "application/json",
      "Authorization": "Bearer " + this.accessToken,
    };
  }

  async sendQuery(query, variables) {
    let response = await axios({
      method: 'POST',
      url: `${this.graphAPI}`,
      headers: this.getRequestHeaders(),
      data: { 
        query,
        variables
      }
    })

    if (response.data.errors) {
      let formatted = JSON.stringify(response.data.errors, null, 2);
      console.log(`API error:\n${formatted}`);
    }

    return response;
  }

// <subscribeToEvent>
  async subscribeToEvent(hubName, projectName, componentName, eventType) {
    try {
      let rootComponentId = await this.getRootComponentId(hubName, projectName, componentName);

      let response = await this.sendQuery(
        `mutation CreateWebhook($componentId: ID!, $eventType: WebhookEventTypeEnum!, $callbackURL: String!) {
          createWebhook(webhook: {
            componentId: $componentId,
            eventType: $eventType,
            callbackURL: $callbackURL,
            expiresOn: "2022-10-12T07:20:50.52Z",
            secretToken: "12345678901234567890123456789012"
          }) {
            id
          }
        }`,
        {
          componentId: rootComponentId,
          eventType,
          callbackURL: this.callbackUrl
        }
      )

      let webhookId = response.data.data.createWebhook.id;

      console.log('Created webhook ' + webhookId + ' for component ' + rootComponentId);

      return webhookId;
    } catch (err) {
      console.log("There was an issue: " + err.message)
    }
  }
// </subscribeToEvent>

// <unsubscribeToEvent>
  async unsubscribeToEvent(eventType) {
    try {
      let webhooks = await this.getWebhooks(eventType);

      for (let webhook of webhooks) {
        let response = await this.sendQuery(
          `mutation DeleteWebhook($webhookId: String!) {
            deleteWebhook(webhookId: $webhookId)
          }`,
          {
            webhookId: webhook.id
          }
        )

        console.log('Deleted webhook ' + response.data.data.deleteWebhook);
      } 
    } catch (err) {
      console.log("There was an issue: " + err.message)
    }
  }
// </unsubscribeToEvent>

  getComponent(response, hubName, projectName, componentName) {
    let hubs = response.data.data.hubs.results;
    if (hubs.length < 1)
      throw { message: `Hub "${hubName}" does not exist` }
      
    let projects = hubs[0].projects.results;
    if (projects.length < 1)
      throw { message: `Project "${projectName}" does not exist` }

    let files = projects[0].rootFolder.items.results;
    if (files.length < 1)
      throw { message: `Component "${componentName}" does not exist` }

    return files[0];
  }

  async getRootComponentId(hubName, projectName, componentName) {
    let response = await this.sendQuery(
      `query GetRootComponent($hubName: String!, $projectName: String!, $componentName: String!) {
        hubs(filter:{name:$hubName}) {
          results {
            name
            projects(filter:{name:$projectName}) {
              results {
                name
                rootFolder {
                  items(filter:{name:$componentName}) {
                    results {
                      ... on Component {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }`,
      {
        hubName,
        projectName,
        componentName
      }
    )

    let rootComponent = this.getComponent(
      response, hubName, projectName, componentName
    );

    return rootComponent.id;
  }

  async getWebhooks(eventType) {
    let response = await this.sendQuery(
      `query GetWebhooks {
        webhooks {
          results {
            id
            eventType
          }
        }
      }`
    )

    let webhooks = response.data.data
      .webhooks.results.filter(webhook => {
        return (
          webhook.eventType === eventType
        )
      });

    return webhooks;
  }

// <startMonitoringEvents>
  async startMonitoringEvents() {
    try {
      console.log(
        `Listening to the events on http://localhost:${this.port} => ${this.callbackUrl}`
      );
      app.post(this.callbackPath, async (req, res) => {
        // Format the json string content to make it easier to read
        let formatted = JSON.stringify(req.body, null, 2);

        console.log(`Received a notification with following content:\n${formatted}`);

        res.status(200).end();
      });
      app.listen(this.port);
    } catch (error) {
      console.log(error);
    }
  };
// </startMonitoringEvents>
}
