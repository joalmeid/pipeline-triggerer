import { BuildDefinitionReference, Build } from 'azure-devops-node-api/interfaces/BuildInterfaces';
import { IBuildConfiguration } from './interface';

export class BuildConfiguration implements IBuildConfiguration {

    projectName: string;
    path: string;
    definitionId: number | null;
    IdOutputVariable: string | null;
    definition: BuildDefinitionReference;
    configuration: Build;
    async: boolean = false;

    constructor(
        public projectId: string,
        public pipelineName: string,
        public branch: string,
        // public projectName: string | null
        
    ) {
    }

}