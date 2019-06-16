import { BuildDefinitionReference, Build } from 'azure-devops-node-api/interfaces/BuildInterfaces';

export interface IBuildConfiguration {
    path: string;
    projectName: string;
    projectId: string;
    pipelineName: string;
    definitionId: number | null;
    definition: BuildDefinitionReference | null;
    IdOutputVariable: string | null;
    branch: string;
    async: boolean;

    configuration: Build;
}

