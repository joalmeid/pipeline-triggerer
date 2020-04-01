import tl = require('azure-pipelines-task-lib/task');
import { BuildDefinitionReference } from 'azure-devops-node-api/interfaces/BuildInterfaces';
import { ReleaseDefinition, Release } from 'azure-devops-node-api/interfaces/ReleaseInterfaces';
import { TaskOptions } from './configuration';
import { AdoApi } from './ado-api';
import { BuildConfiguration, ReleaseConfiguration} from './configuration';
import { BuildWorker } from './queue-build.worker';
import { ReleaseWorker } from './queue-release.worker';
import { TaskSummary } from './util/task-summary';
import { BuildApi } from 'azure-devops-node-api/BuildApi';

function sleep(ms): Promise<{}> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class PipelineTrigger {
    public taskOptions: TaskOptions;            // options configured at the task screen

    constructor(taskOptions: TaskOptions) {
        this.taskOptions = taskOptions;     // task inputs
    }

    public async start(): Promise<any> {
        try {
            if (this.taskOptions.avPipeline == 'Build') {
                await this.BuildPipelineTrigger();
            }
            else if (this.taskOptions.avPipeline == "Release") {
                await this.ReleasePipelineTrigger();
            }  
        } catch (err) {
            // Log the error
            let taskMessage: string = ` ${err.message}`;

            tl.debug(JSON.stringify(err));
            tl.setResult(tl.TaskResult.Failed, taskMessage);
        }
    }

    /*
    * Triggers a build pipelines execution
    *    - Get build pipeline definitions
    *    - Prepare build pipeline for execution
    *    - Queue build in Azure DevOps
    *    - Capture Errors
    *    - Logging success/fails
    */
    public async BuildPipelineTrigger(): Promise<any> {
        
        let worker: BuildWorker;
        let pipelineConfig: BuildConfiguration;
    
        try{

            // Get Vsts Build Api
            let api = new AdoApi(this.taskOptions.avConnectedServiceNameUrl,this.taskOptions.avToken);
            let buildApi = await api.getBuildApi();

            // Get build definitions
            let buildDefinitions = await buildApi.getDefinitions(this.taskOptions.avADOProjectId,this.taskOptions.avBuildPipelineName);
            if(buildDefinitions == null || buildDefinitions.length != 1)
            {
                // Unable to identify build pipeline to trigger
                let errMessage = `Build Pipeline named "${this.taskOptions.avBuildPipelineName}" in project "${this.taskOptions.avADOProjectId}" not found.`
                throw Error(errMessage);
            }

            // Build pipeline identifyed
            let bDefinition: BuildDefinitionReference = buildDefinitions[0];
            pipelineConfig = new BuildConfiguration( bDefinition.project.id, bDefinition.name, this.taskOptions.avBranch);
            pipelineConfig.path = bDefinition.path;
            pipelineConfig.definitionId = bDefinition.id;
            pipelineConfig.projectId = bDefinition.project.id;
            pipelineConfig.definition = bDefinition;
            pipelineConfig.async = this.taskOptions.avAsync;
            pipelineConfig.IdOutputVariable = this.taskOptions.avPipelineIdOutputVariable;

            worker = new BuildWorker(pipelineConfig, buildApi);
            await worker.queuePipeline();

            // Complete task if async is true
            if (pipelineConfig.async === true) {
                TaskSummary.attach(worker, this.taskOptions);
                tl.setResult(tl.TaskResult.Succeeded, `Build pipeline triggered successfully (async).`);
                return;
            }
            
            // Poll build result
            do {
                await sleep(2000);
            } while (!(await worker.getCompletedStatus()));
            
            // Finish task
            TaskSummary.attach(worker, this.taskOptions);

            // Check build status
            if (worker.getSuccessStatus() === false) {
                // At least one build failed
                tl.setResult(tl.TaskResult.Failed, `Triggered pipeline failed.`);
                return;
            }

            // Queued Build successfully completed
            tl.setResult(tl.TaskResult.Succeeded, `Triggered pipeline finished successfully.`);
        }
        catch (error) {
            console.error(error);
            TaskSummary.attach(worker, this.taskOptions);
            tl.setResult(tl.TaskResult.Failed, `Pipeline triggering failed.`);
        }
    }

    /*
    * Triggers a release pipelines execution
    *    - Get release pipeline definitions
    *    - Prepare release pipeline for execution
    *    - BuildArtifacts Item from build
    *    - Create release pipeline 
    *    - Queue release in Azure DevOps
    *    - Capture Errors
    *    - Logging success/fails
    */
    public async ReleasePipelineTrigger() : Promise<any> {
        let worker: ReleaseWorker;
        let pipelineConfig: ReleaseConfiguration;
    
        try{

            // Get Vsts Build Api
            let api = new AdoApi(this.taskOptions.avConnectedServiceNameUrl,this.taskOptions.avToken);
            let releaseApi = await api.getReleaseApi();
            let buildApi = await api.getBuildApi();

            // Get release definitions
            const releaseDefinitions: ReleaseDefinition[] = await releaseApi.getReleaseDefinitions(this.taskOptions.avADOProjectId,this.taskOptions.avReleasePipelineName);
            if(releaseDefinitions == null || releaseDefinitions.length != 1)
            {
                // Unable to identify release pipeline to trigger
                let errMessage = `Release Pipeline named "${this.taskOptions.avReleasePipelineName}" in project "${this.taskOptions.avADOProjectId}" not found.`
                throw Error(errMessage);
            }

            // Release pipeline identifyed
            let releaseDef = releaseDefinitions[0];
            pipelineConfig = new ReleaseConfiguration( this.taskOptions.avADOProjectId, releaseDef.name);
            // pipelineConfig.projectName = releaseDef.projectReference.name;
            pipelineConfig.pipelineId = releaseDef.id;
            pipelineConfig.definition = releaseDef;
            pipelineConfig.description = this.taskOptions.avDescription ? this.taskOptions.avDescription : `Triggered by ADO pipeline triggerer.` ;
            pipelineConfig.configuration = null;
            pipelineConfig.IdOutputVariable = this.taskOptions.avPipelineIdOutputVariable;
            pipelineConfig.async = this.taskOptions.avAsync;

            worker = new ReleaseWorker(pipelineConfig, releaseApi, buildApi);
            await worker.queuePipeline();

            // Complete task if async is true
            if (pipelineConfig.async === true && worker.getCompletedStatus(pipelineConfig.async)) {
                TaskSummary.attach(worker, this.taskOptions);
                tl.setResult(tl.TaskResult.Succeeded, `Release pipeline triggered successfully (async).`);
                return;
            }
            
            // Running synchronously. Poll release result
            do {
                await sleep(2000);
            } while (!(await worker.getCompletedStatus(pipelineConfig.async)));
            
            // Finish task
            TaskSummary.attach(worker, this.taskOptions);

            // Check build status
            if (worker.getSuccessStatus() === false) {
                // At least one build failed
                tl.setResult(tl.TaskResult.Failed, `Triggered pipeline failed.`);
                return;
            }

            // Queued Build successfully completed
            tl.setResult(tl.TaskResult.Succeeded, `Triggered pipeline finished successfully.`);
        }
        catch (error) {
            console.error(error);
            TaskSummary.attach(worker, this.taskOptions);
            tl.setResult(tl.TaskResult.Failed, `Pipeline triggering failed.`);
        }
    }
}
