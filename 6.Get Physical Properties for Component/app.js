// Axios is a promise-based HTTP client for the browser and node.js. 
import axios from "axios";

// We need the following in order to save files to the machine
import fs from "fs";  
import path from "path"; 

// Application constructor 
export default class App {
  constructor(accessToken) {
    this.graphAPI = 'https://developer.api.autodesk.com/graphql';
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

  getComponentVersionPhysicalProperties(response, hubName, projectName, componentName) {
    let hubs = response.data.data.nav.hubs.results;
    if (hubs.length < 1)
      throw { message: `Hub "${hubName}" does not exist` }
      
    let projects = hubs[0].projects.results;
    if (projects.length < 1)
      throw { message: `Project "${projectName}" does not exist` }

    let files = projects[0].folders.results[0].items.results;
    if (files.length < 1)
      throw { message: `Component "${componentName}" does not exist` }

    return files[0].tipRootComponent.physicalProperties;
  }

// <getPhysicalProperties>
  async getPhysicalProperties(hubName, projectName, componentName) {
    try {
      while (true) {
        let response = await this.sendQuery(
          `query GetPhysicalProperties($hubName: String!, $projectName: String!, $componentName: String!) {
            nav {
              hubs(filter:{name:$hubName}) {
                results {
                  projects(filter:{name:$projectName}) {
                    results {
                      folders {
                        results {
                          items(filter:{name:$componentName}) {
                            results {
                              ... on MFGDesignItem {
                                tipRootComponent {
                                  physicalProperties {
                                    status
                                    area {
                                      displayValue
                                      propertyDefinition {
                                          units {
                                            name
                                          }
                                        }
                                    }
                                    volume {
                                      displayValue
                                      propertyDefinition {
                                          units {
                                            name
                                          }
                                        }
                                    }
                                    mass {
                                      displayValue
                                      value
                                      propertyDefinition {
                                          units {
                                            name
                                          }
                                        }
                                    }
                                    density {
                                      displayValue
                                      propertyDefinition {
                                          units {
                                            name
                                          }
                                        }
                                    }
                                    boundingBox {
                                      length {
                                        displayValue
                                        propertyDefinition {
                                          units {
                                            name
                                          }
                                        }
                                      }
                                      height {
                                        displayValue
                                        propertyDefinition {
                                          units {
                                            name
                                          }
                                        }
                                      }
                                      width {
                                        displayValue
                                        propertyDefinition {
                                          units {
                                            name
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

        let geometry = this.getComponentVersionPhysicalProperties(
          response, hubName, projectName, componentName
        );

        if (geometry.status === "COMPLETED") {
          return geometry;
        }
      }
    } catch (err) {
      console.log("There was an issue: " + err.message)
    }
  }
// </getPhysicalProperties>
}
