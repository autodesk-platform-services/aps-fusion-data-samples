// Axios is a promise-based HTTP client for the browser and node.js. 
import axios from "axios";

// Application constructor 
export default class App {
  constructor(accessToken) {
    this.graphAPI = 'https://developer.api.autodesk.com/graphql';
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

  getComponentVersion(response, hubName, projectName, componentName) {
    let hubs = response.data.data.hubs.results;
    if (hubs.length < 1)
      throw { message: `Hub "${hubName}" does not exist` }
      
    let projects = hubs[0].projects.results;
    if (projects.length < 1)
      throw { message: `Project "${projectName}" does not exist` }

    let files = projects[0].rootFolder.items.results;
    if (files.length < 1)
      throw { message: `Component "${componentName}" does not exist` }

    return files[0].tipVersion;
  }

// <getModelHierarchy>
  async getModelHierarchy(hubName, projectName, componentName) {
    try {
      let response = await this.sendQuery(
        `query GetModelHierarchy($hubName: String!, $projectName: String!, $componentName: String!) {
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
                          name
                          tipVersion {
                            id
                            name 
                            modelOccurrences {
                              results {
                                componentVersion {
                                  id
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
        }`,
        {
          hubName,
          projectName,
          componentName
        }
      )

      let rootComponentVersion = this.getComponentVersion(
        response, hubName, projectName, componentName
      );
      let componentVersions = {};
      componentVersions[rootComponentVersion.id] = rootComponentVersion;

      await this.getSubComponents(componentVersions, rootComponentVersion.modelOccurrences.results);

      return {
        rootId: rootComponentVersion.id,
        componentVersions: componentVersions
      };
    } catch (err) {
      console.log("There was an issue: " + err.message)
    }
  }
// </getModelHierarchy>  

  async getSubComponents(componentVersions, modelReferences) {
    for (let occurrence of modelReferences) {
      componentVersions[occurrence.componentVersion.id] ||= {};
    }

    let query = "query {";
    let counter = 0;
    for (let componentVersionId in componentVersions) {
      // Get info about components we only have the id's of
      // but no information yet about the component (e.g. its name)
      if (!componentVersions[componentVersionId]?.name) {
        query += `
        _${counter++}: componentVersion(componentVersionId: "${componentVersionId}") {
          id
          name
          modelOccurrences {
            results {
              componentVersion {
                id
                name
              }
            }
          }
        }
      `
      }
    }
    query += "}"

    if (counter === 0) {
      return;
    }

    let response = await this.sendQuery(query);
    for (let componentVersion of Object.values(response.data.data)) {
      componentVersions[componentVersion.id] = componentVersion;
    }

    for (let componentVersion of Object.values(response.data.data)) {
      if (componentVersion.modelOccurrences.results.length > 0) {
        await this.getSubComponents(componentVersions, componentVersion.modelOccurrences.results);
      }
    }
  }

  // <getModelHierarchyBeta>
  async getModelHierarchyBeta(hubName, projectName, componentName) {
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
                    folders {
                      results {
                        items(filter:{name:$componentName}) {
                          results {
                            ... on MFGDesignItem {
                              name
                              tipRootComponent {
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
            }
          }
        }`,
        {
          hubName,
          projectName,
          componentName
        }
      )

      let rootComponentVersion = response.data.data.nav.hubs.results[0].projects.results[0].folders.results[0].items.results[0].tipRootComponent;
      let cursor = rootComponentVersion.allModelOccurrences.pagination.cursor;

      // Keep getting the rest of the occurrences if needed
      while (cursor) {
        response = await this.sendQuery(
          `query GetModelHierarchy($componentVersionId: String!, $cursor: String!) {
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
// </getModelHierarchyBeta>  
}



