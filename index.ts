import * as azureDevops from 'azure-devops-node-api';
import * as azureCoreApi from 'azure-devops-node-api/CoreApi';
import * as azureBuildApi from 'azure-devops-node-api/BuildApi';
import * as json2CSV from 'json-2-csv';
import * as fs from 'fs';

import {
  Build,
  BuildDefinitionReference,
  BuildReason,
} from 'azure-devops-node-api/interfaces/BuildInterfaces';
import { TeamProjectReference } from 'azure-devops-node-api/interfaces/CoreInterfaces';

interface Repository {
  project: string;
  repository: string;
  definitionId: number;
}

const list = ['example-repo-web'];

async function main() {
  // Create connection
  const orgUrl = 'https://dev.azure.com/wizsolucoes';
  const token: string = process.env.AZURE_PERSONAL_ACCESS_TOKEN;
  const authHandler = azureDevops.getPersonalAccessTokenHandler(token);
  const connection = new azureDevops.WebApi(orgUrl, authHandler);

  // Get APIs
  const coreApi: azureCoreApi.ICoreApi = await connection.getCoreApi();
  const buildApi: azureBuildApi.IBuildApi = await connection.getBuildApi();

  // Get projects
  const projects: TeamProjectReference[] = await coreApi.getProjects();

  const repos: Repository[] = [];

  // For each project
  for (const project of projects) {
    // Get project definitions
    console.log(`Fetching definitions for project ${project.name}`);

    const definitions: BuildDefinitionReference[] =
      await buildApi.getDefinitions(project.name);

    // Filter definitions of web apps
    const webAppDefinitions = definitions.filter(
      (defintion: BuildDefinitionReference) => {
        const name: String = defintion.name;
        return (
          project.name != 'Training' &&
          project.name != 'POCS' &&
          (name.endsWith('web CI') ||
            name.endsWith('web') ||
            name.endsWith('Web CI') ||
            name.endsWith('Web'))
        );
      }
    );

    webAppDefinitions.forEach((defintion: BuildDefinitionReference) => {
      const repositoryName = defintion.name.replace(/\sCI$/, '');

      if (list.indexOf(repositoryName) > -1) {
        repos.push({
          project: defintion.project.name,
          repository: repositoryName,
          definitionId: defintion.id,
        });
      }
    });
  } // End of for (const project of projects)

  // Output defintions found to a csv file
  json2CSV.json2csv(repos, (err, csv) => {
    if (err) {
      throw err;
    }

    // write CSV to a file
    fs.writeFileSync('repositories.csv', csv);
  });

  for (const repo of repos) {
    const build: Build = {
      definition: {
        id: repo.definitionId,
      },
    };

    console.log(`Queing build for ${repo.repository}`);

    try {
      await buildApi.queueBuild(build, repo.project);
    } catch (error) {
      console.log('error', error);
    }
  }
}

main();
