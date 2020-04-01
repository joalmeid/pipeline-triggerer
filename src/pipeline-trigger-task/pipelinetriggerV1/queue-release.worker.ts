import tl = require('azure-pipelines-task-lib/task');
import { ArtifactMetadata, Release, BuildVersion, ReleaseReason, ReleaseStatus, EnvironmentStatus, ReleaseStartMetadata } from 'azure-devops-node-api/interfaces/ReleaseInterfaces';
import { IQueueWorker, IReleaseConfiguration } from './configuration/interface';
import { ReleaseApi } from './release-api';
import { BuildApi } from './build-api';
import { updateOutputVariable } from './util/output';
import { TaskSummary } from './util/task-summary';

const outputTimeInterval: number = 1000 * 60 * 2.5; // 2.5 Minutes

export class ReleaseWorker implements IQueueWorker {

    private releaseId: number;
    private lastOutputTime: number;
    public cachedStatus: boolean;
    private cachedReleaseResult: Release = null;

    constructor(
        private releaseConfiguration: IReleaseConfiguration,
        private releaseApi: ReleaseApi,
        private buildApi: BuildApi
    ) { }

    public async queuePipeline(): Promise<void> {
        // Invalid definition handling
        if (this.releaseConfiguration.pipelineId == null) {
            this.cachedStatus = true;
            return;
        }

        // Release pippeline to be triggered
        let release: ReleaseStartMetadata;
        let buildArtifacts: ArtifactMetadata[] = [];

        // let buildVersion = await this.getBuildVersion(Number(tl.getVariable("build.BuildId")), this.releaseConfiguration.projectId);
        
        // console.log("Getting build artifacts");
        // buildArtifacts = await this.getBuildArtifacts(Number(tl.getVariable("build.BuildId")), this.releaseConfiguration.projectId, buildVersion);
        // console.log(`Found build artifacts ${buildVersion.id}`);

        //Get Release Artifacts 
        console.log("Getting release artifacts");
        let releaseArtifacts = await this.getReleaseArtifacts(this.releaseConfiguration.projectId,this.releaseConfiguration.pipelineId);
        console.log(`Found release artifacts: ${releaseArtifacts.map(ra => { return ra.alias; }).join(", ")}`);

        let requestedRelease: ReleaseStartMetadata = { 
            definitionId: this.releaseConfiguration.pipelineId, // Sets definition Id to create a release.
            description: this.releaseConfiguration.description, // 'Queued by ADO pipeline triggerer' // Sets description to create a release.
            isDraft: false, // Sets 'true' to create release in draft mode, 'false' otherwise.
            manualEnvironments: new Array<string>(), // Sets list of environments to manual as condition.
            properties: {},
            reason:  ReleaseReason.ContinuousIntegration, // Sets reason to create a release.
            //artifacts: releaseArtifacts // Sets list of artifact to create a release.
            // environmentsMetadata?: ReleaseStartEnvironmentMetadata[]; // Sets list of environments meta data.
            // variables?: { [key: string]: ConfigurationVariableValue; }; // Sets list of release variables to be overridden at deployment time.
        };

        console.log("Requesting release");
        let curRelease = await this.releaseApi.createRelease(requestedRelease, this.releaseConfiguration.projectId);
        this.releaseId = curRelease.id;
        console.log(`\tRelease "${this.releaseConfiguration.pipelineName}" started - ReleaseId: ${this.releaseId}`);
        console.log(`\tLink: ${curRelease._links.web.href}`);

        this.setReleaseIdOutputVariable();

        // Set initial release link for async tasks
        if (this.releaseConfiguration.async === true) {
            this.cachedReleaseResult = await this.releaseApi.getRelease(this.releaseConfiguration.projectId,this.releaseId);
        }
        this.lastOutputTime = new Date().getTime();
    }

    public getPipelineName(): string {
        //return this.releaseConfiguration.originalReleaseName;
        return this.releaseConfiguration.pipelineName;
    }

    public getPipelineResult(): Release {
        return this.cachedReleaseResult;
    }

    public getSuccessStatus(): boolean {
        let overallDeploymentStatus: boolean = false;

        // if (this.cachedStatus === true && this.cachedReleaseResult) {
        if (this.cachedReleaseResult) {

            console.log(`Release Deployment Status: ${this.cachedReleaseResult.environments.map(env => { return `${env.name}: ${env.status}`; }).join(", ")}`);
            let overallEnvironmentStatus: Array<boolean> = new Array<boolean>();

            if (this.cachedReleaseResult.status === ReleaseStatus.Active) { //Undefined = 0, Draft = 1, Active = 2, Abandoned = 4
                this.cachedReleaseResult.environments.forEach(env => {
                    overallEnvironmentStatus.push((env.status === EnvironmentStatus.Succeeded || env.status === EnvironmentStatus.PartiallySucceeded));
                });
                overallDeploymentStatus = overallDeploymentStatus ? overallDeploymentStatus : overallEnvironmentStatus[0]; 
                overallEnvironmentStatus.forEach(envStatus => { overallDeploymentStatus = overallDeploymentStatus && envStatus});

                return overallDeploymentStatus;
            }
        }
        return overallDeploymentStatus;
    }

    public async getCompletedStatus(async? : boolean): Promise<boolean> {
        
        let completedStatus: boolean = false;
        
        // Avoid status check for already completed tasks
        if (this.cachedStatus === true) {
            return this.cachedStatus;
        }

        // Check release status
        this.cachedReleaseResult = await this.releaseApi.getRelease(this.releaseConfiguration.projectId, this.releaseId);

        if (this.cachedReleaseResult.status === ReleaseStatus.Active && async) { //Undefined = 0, Draft = 1, Active = 2, Abandoned = 4
            console.log(`\tRelease "${this.releaseConfiguration.pipelineName}" ative - Name: ${this.cachedReleaseResult.name}, Id: ${this.cachedReleaseResult.id}`);
            this.cachedStatus = true;
            return true;
        }

        // Running synchronously
        completedStatus = this.getSuccessStatus();
        /** DeploymentStatus
            Undefined = 0, // The deployment status is undefined.
            NotDeployed = 1, // The deployment status is not deployed.
            InProgress = 2, // The deployment status is inprogress.
            Succeeded = 4, // The deployment status is succeeded.
            PartiallySucceeded = 8, // The deployment status is partiallysucceeded.
            Failed = 16, // The deployment status is failed.
            All = 31, // The deployment status is all.
        **/

        // console.log(`Release Deployment Status: ${this.cachedReleaseResult.environments.map(env => { return `${env.name}: ${env.status}`; }).join(", ")}`);
        // let overallEnvironmentStatus: Array<boolean> = new Array<boolean>();
        // let overallDeploymentStatus: boolean;

        // if (this.cachedReleaseResult.status === ReleaseStatus.Active) { //Undefined = 0, Draft = 1, Active = 2, Abandoned = 4
        //     this.cachedReleaseResult.environments.forEach(env => {
        //         overallEnvironmentStatus.push((env.status === EnvironmentStatus.Succeeded || env.status === EnvironmentStatus.PartiallySucceeded));
        //     });
        //     overallDeploymentStatus = overallDeploymentStatus ? overallDeploymentStatus : overallEnvironmentStatus[0]; 
        //     overallEnvironmentStatus.forEach(envStatus => { overallDeploymentStatus = overallDeploymentStatus && envStatus});

        //     return overallDeploymentStatus;
        // }

        // Ensure output during running releases
        let currentTime = new Date().getTime();
        if (currentTime - outputTimeInterval > this.lastOutputTime) {
            console.log(`\tRelease "${this.releaseConfiguration.pipelineName}" is running - Name: ${this.cachedReleaseResult.name}, Id: ${this.cachedReleaseResult.id}`);
            this.lastOutputTime = currentTime;
        }

        return completedStatus;
    }

    private setReleaseIdOutputVariable() {
        // GLobal configuration
        updateOutputVariable(this.releaseConfiguration.IdOutputVariable, this.releaseId);

        // Release specific configuration
        updateOutputVariable(this.releaseConfiguration.IdOutputVariable, this.releaseId);
    }

    private async getReleaseArtifacts(project: string, releaseId: number): Promise<ArtifactMetadata[]> {
        let releaseArtifacts = await this.releaseApi.getArtifactVersions(project,releaseId);

        let artifactMetadatas: ArtifactMetadata[] = new Array<ArtifactMetadata>();

        releaseArtifacts.artifactVersions.forEach(ra => {
            let bam = { 
                alias: ra.defaultVersion ? ra.alias : null,
                instanceReference: {
                    "id": ra.defaultVersion ? ra.defaultVersion.id : null,
                    "name": ra.defaultVersion ? ra.defaultVersion.name : null
                    }
            };
            bam.alias ? artifactMetadatas.push(bam) : null;
        });

        return artifactMetadatas;
    }

    private async getBuildVersion(buildId: number, project: string): Promise<BuildVersion> {
        let buildData = await this.buildApi.getBuild(buildId, project);

        let buildVersion: BuildVersion = {
            sourceBranch: buildData.sourceBranch,
            sourceRepositoryId: buildData.repository.id,
            sourceVersion: buildData.sourceVersion,
            commitMessage: "",
            id: buildData.id.toString(),
            name: buildData.buildNumber,
            sourceRepositoryType: buildData.repository.type
        };

        return buildVersion;
    }

    private async getBuildArtifacts(buildId: number, project: string, buildVersion: BuildVersion): Promise<ArtifactMetadata[]> {
        let buildArtifacts = await this.buildApi.getBuildArtifacts(buildId, project);
        // let y = await this.releaseApi.getArtifactVersionsForSources(buildArtifacts, project);

        let buildArtifactMetadatas: ArtifactMetadata[];

        buildArtifacts.forEach(ba => {
            let bam = { 
                alias: ba.name, 
                instanceReference: buildVersion
            };
            buildArtifactMetadatas.push(bam);
        });

        return buildArtifactMetadatas;
    }
}