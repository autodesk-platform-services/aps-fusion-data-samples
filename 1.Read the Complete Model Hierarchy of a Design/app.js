// Axios is a promise-based HTTP client for the browser and node.js. 
import axios from "axios";

// Application constructor 
export default class App {
  constructor(accessToken) {
    this.graphAPI = 'https://developer.api.autodesk.com/beta/graphql';
    this.accessToken = accessToken;
  }

  getRequestHeaders() {
    return {
      "Content-type": "application/json; charset=utf-8",
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

  // <getModelHierarchy>
  async getModelHierarchy(hubName, projectName, componentName) {
    try {
      // Get first batch of occurrences
      let response = await this.sendQuery(
        `query GetComponentVersion($hubName: String!, $projectName: String!, $componentName: String!) {
          nav {
            hubs(filter:{name:$hubName}) {
              results {
                name
                projects(filter:{name:$projectName}) {
                  results {
                    name
                    items(filter:{name:$componentName}) {
                      results {
                        ... on MFGDesignItem {
                          name
                          tipRootComponentVersion {
                            id
                            name 
                            allModelOccurrences {
                              results {
                                parentComponentVersion {
                                  id 
                                }
                                componentVersion {
                                  id
                                  name
                                }
                              }
                              pagination {
                                cursor
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

      let rootComponentVersion = response.data.data.nav.hubs.results[0].projects.results[0].items.results[0].tipRootComponentVersion;
      let cursor = rootComponentVersion.allModelOccurrences.pagination.cursor;

      // Keep getting the rest of the occurrences if needed
      while (cursor) {
        response = await this.sendQuery(
          `query GetModelHierarchy($componentVersionId: ID!, $cursor: String) {
            mfg {
              componentVersion(componentVersionId: $componentVersionId) {
                allModelOccurrences (pagination: {cursor: $cursor}) {
                  results {
                    parentComponentVersion {
                      id 
                    }
                    componentVersion {
                      id
                      name
                    }
                  }
                  pagination {
                    cursor
                  }
                }
              }
            }
          }`,
          {
            componentVersionId: rootComponentVersion.id,
            cursor
          }
        )

        rootComponentVersion.allModelOccurrences.results = 
          rootComponentVersion.allModelOccurrences.results.concat(
            response.data.data.mfg.componentVersion.allModelOccurrences.results);
        cursor = response.data.data.mfg.componentVersion.allModelOccurrences.pagination.cursor;
      }

      return rootComponentVersion;
    } catch (err) {
      console.log("There was an issue: " + err.message)
    }
  }
// </getModelHierarchy>  
}



