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

  getComponentVersionThumbnail(response, hubName, projectName, componentName) {
    let hubs = response.data.data.nav.hubs.results;
    if (hubs.length < 1)
      throw { message: `Hub "${hubName}" does not exist` }
      
    let projects = hubs[0].projects.results;
    if (projects.length < 1)
      throw { message: `Project "${projectName}" does not exist` }

    let files = projects[0].items.results;
    if (files.length < 1)
      throw { message: `Component "${componentName}" does not exist` }

    return files[0].tipRootComponentVersion.thumbnail;
  }

// <downloadThumbnail>
  async downloadThumbnail(hubName, projectName, componentName) {
    try {
      while (true) {
        let response = await this.sendQuery(
          `query GetThumbnail($hubName: String!, $projectName: String!, $componentName: String!) {
            nav {
              hubs(filter:{name:$hubName}) {
                results {
                  projects(filter:{name:$projectName}) {
                    results {
                      items(filter:{name:$componentName}) {
                        results {
                          ... on MFGDesignItem {
                            tipRootComponentVersion {
                              thumbnail {
                                status
                                url
                              }          
                            }
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

        let thumbnail = this.getComponentVersionThumbnail(
          response, hubName, projectName, componentName
        );

        if (thumbnail.status === "SUCCESS") {
          // If the thumbnail generation finished then we can download it
          // from the url
          let thumbnailPath = path.resolve('thumbnail.png');
          await this.downloadImage(thumbnail.url, thumbnailPath);
          return "file://" + encodeURI(thumbnailPath);
        } else {
          console.log("Extracting thumbnail … (it may take a few seconds)")
          // Let's wait a second before checking the status of the thumbnail again
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (err) {
      console.log("There was an issue: " + err.message)
    }
  }
// </downloadThumbnail>

  async downloadImage(url, path) {  
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
