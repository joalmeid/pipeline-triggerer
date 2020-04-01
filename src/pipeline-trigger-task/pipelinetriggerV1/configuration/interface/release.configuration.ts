import { ReleaseDefinition, Release } from 'azure-devops-node-api/interfaces/ReleaseInterfaces';

export interface IReleaseConfiguration {
    projectName: string;
    projectId: string;
    pipelineId: number | null;
    pipelineName: string;
    definition: ReleaseDefinition | null;
    description: string | null;

    IdOutputVariable: string | null;
    async: boolean;
    configuration: Release;
}