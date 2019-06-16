import tl = require('azure-pipelines-task-lib/task');
import { Build, BuildStatus, BuildResult, DefinitionReference } from 'azure-devops-node-api/interfaces/BuildInterfaces';
import { IQueueWorker, IBuildConfiguration } from './configuration/interface';
import { BuildApi } from './build-api';
import { updateOutputVariable } from './util/output';

const outputTimeInterval: number = 1000 * 60 * 2.5; // 2.5 Minutes

export class BuildWorker implements IQueueWorker {

    private buildId: number;
    private lastOutputTime: number;
    private cachedBuildResult: Build = null;
    public cachedStatus: boolean;

    constructor(
        private buildConfiguration: IBuildConfiguration,
        private buildApi: BuildApi
    ) { }

    public async queuePipeline(): Promise<void> {
        // Invalid definition handling
        if (this.buildConfiguration.definitionId == null) {
            this.cachedStatus = true;
            return;
        }

        // Build pippeline to be triggered
        let build: Build = this.buildConfiguration;

        // Ensure valid build definition
        if (build == null) {
            build = <Build>{};
        }
        if (build.definition == null) {
            build.definition = <DefinitionReference>{ id: 0 };
        }
        
        // Queue Build using Azure DevOps Rest API
        let buildQueueResult = await this.buildApi.queueBuild(this.buildConfiguration, this.buildConfiguration.projectId, true);
        this.buildId = buildQueueResult.id;
        console.log(`\tBuild "${this.buildConfiguration.pipelineName}" started - BuildId: ${buildQueueResult.buildNumber}`);
        console.log(`\tLink: ${buildQueueResult._links.web.href}`);

        this.setBuildIdOutputVariable();

        // Set initial build link for async tasks
        if (this.buildConfiguration.async === true) {
            this.cachedBuildResult = await this.buildApi.getBuild(this.buildId,this.buildConfiguration.projectId);
        }
        this.lastOutputTime = new Date().getTime();
    }

    public getPipelineName(): string {
        //return this.buildConfiguration.originalBuildName;
        return this.buildConfiguration.pipelineName;
    }

    public getPipelineResult(): Build {
        return this.cachedBuildResult;
    }

    public getSuccessStatus(): boolean {
        if (this.cachedStatus === true
            && this.cachedBuildResult != null
            && (this.cachedBuildResult.result == BuildResult.Succeeded || this.cachedBuildResult.result == BuildResult.PartiallySucceeded)
        ) {
            return true;
        }

        return false;
    }

    public async getCompletedStatus(): Promise<boolean> {
        // Avoid status check for already completed tasks
        if (this.cachedStatus === true) {
            return this.cachedStatus;
        }

        // Check build status
        this.cachedBuildResult = await this.buildApi.getBuild(this.buildId, this.buildConfiguration.projectId);

        if (this.cachedBuildResult.status === BuildStatus.Completed) {
            console.log(`\tBuild "${this.buildConfiguration.pipelineName}" completed - BuildId: ${this.cachedBuildResult.buildNumber}`);
            this.cachedStatus = true;
            return true;
        }

        // Ensure output during running builds
        let currentTime = new Date().getTime();
        if (currentTime - outputTimeInterval > this.lastOutputTime) {
            console.log(`\tBuild "${this.buildConfiguration.pipelineName}" is running - BuildId: ${this.cachedBuildResult.buildNumber}`);
            this.lastOutputTime = currentTime;
        }

        return false;
    }

    private setBuildIdOutputVariable() {
        // GLobal configuration
        updateOutputVariable(this.buildConfiguration.IdOutputVariable, this.buildId);

        // Build specific configuration
        updateOutputVariable(this.buildConfiguration.IdOutputVariable, this.buildId);
    }
}