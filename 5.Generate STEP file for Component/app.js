// Axios is a promise-based HTTP client for the browser and node.js. 
import axios from "axios";

// We need the following in order to save files to the machine
import fs from "fs";  
import path from "path"; 

// Application constructor 
export default class App {
  constructor(accessToken) {
    this.graphAPI = 'https://developer.api.autodesk.com/beta/graphql';
    this.accessToken = accessToken;
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

  async getProjectId(hubName, projectName) {
    try {
      // Get first batch of occurrences
      let response = await this.sendQuery(
        `query GetProjectId($hubName: String!, $projectName: String!) {
          hubs(filter:{name:$hubName}) {
            results {
              name
              projects(filter:{name:$projectName}) {
                results {
                  name
                  id
                }
              }
            }
          }
        }`,
        {
          hubName,
          projectName
        }
      );

      let projectId = response.data.data.hubs.results[0].projects.results[0].id;
      return projectId;
    } catch (err) {
      console.log("There was an issue: " + err.message);
    }
  }

// <downloadGeometry>
  async downloadGeometry(hubName, projectName, componentName) {
    try {
      let projectId = await this.getProjectId(hubName, projectName);

      while (true) {
        let response = await this.sendQuery(
          `query GetGeometry($projectId: ID!, $componentName: String!) {
            project(projectId: $projectId) {
              items(filter:{name:$componentName}) {
                results {
                  ... on DesignItem {
                    tipRootComponentVersion {
                      derivatives (derivativeInput: {outputFormat: STEP, generate: true}) {
                        expires
                        signedUrl
                        status
                        outputFormat
                      }       
                    }
                  }
                }
              }
            }
          }`,
          {
            projectId,
            componentName
          }
        )

        let geometry = response.data.data.project.items.results[0].tipRootComponentVersion.derivatives[0];

        if (geometry.status === "SUCCESS") {
          // If the geometry generation finished then we can download it
          // from the url
          let geometryPath = path.resolve('geometry.stp');
          await this.downloadFile(geometry.signedUrl, geometryPath);
          return "file://" + encodeURI(geometryPath);
        } else {
          console.log("Extracting geometry … (it may take a few seconds)")
          // Let's wait a second before checking the status of the geometry again
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (err) {
      console.log("There was an issue: " + err.message)
    }
  }
// </downloadGeometry>

  async downloadFile(url, path) {  
    const writer = fs.createWriteStream(path);
  
    const response = await axios({
      url,
      method: 'GET',
      headers: this.getRequestHeaders(),
      responseType: 'stream'
    });
  
    response.data.pipe(writer);
  
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }
}
