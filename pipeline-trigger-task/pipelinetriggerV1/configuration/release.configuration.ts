import { ReleaseDefinition, Release } from 'azure-devops-node-api/interfaces/ReleaseInterfaces';
import { IReleaseConfiguration } from './interface';

export class ReleaseConfiguration implements IReleaseConfiguration {
    projectName: string;
    pipelineId: number | null;
    IdOutputVariable: string | null;
    definition: ReleaseDefinition | null;
    async: boolean = false;
    configuration: Release;
    description: string | null;

    constructor(
        public projectId: string,
        public pipelineName: string,
    ) {
    }
}
