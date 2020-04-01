import tl = require('azure-pipelines-task-lib/task');
import path = require('path');

export class TaskOptions {
    public avConnectedServiceId: string;
    public avConnectedServiceNameUrl: string;
    public avToken: string;
    public avEndpointAuthScheme: string;

    public avBuildUrl: string;
    public avReleaseUrl: string;
    public avADOProjectId: string;
    public avBuildPipelineName: string;
    public avReleasePipelineName: string;
    public avPipeline: string;
    public avDescription: string;
    public avBranch: string;
    public avBuildNumber: string;

    public avRequestedFor: string | null;
    public avAsync: boolean;
    public avPipelineIdOutputVariable: string | null;
    public avWorkDirectory: string;

    constructor() {

        // Get ADO Task input values

        // ADO Service Endpoint Task input values
        this.avConnectedServiceId = tl.getInput('avConnectedServiceName', true);
        this.avConnectedServiceNameUrl = this.getConnectedServiceUri(this.avConnectedServiceId);
        this.avToken = this.getAccessToken(this.avConnectedServiceId);
        this.avEndpointAuthScheme = this.getAuthScheme(this.avConnectedServiceId);

        // Pipeline Trigger Task input values
        this.avBuildUrl = this.getBuildEndpointUri(this.avConnectedServiceId);
        this.avReleaseUrl = this.getReleaseEndpointUri(this.avConnectedServiceId);
        this.avADOProjectId = tl.getInput('avProject', true); 
        this.avPipeline = tl.getInput('avPipeline', true); 
        this.avBuildPipelineName = tl.getInput('avBuildDefinition', this.avPipeline == 'Build'); 
        this.avReleasePipelineName = tl.getInput('avReleaseDefinition', this.avPipeline == 'Release'); 
        this.avDescription = tl.getInput('avDescription', false); 
        this.avBranch = tl.getInput('avBranch', false) || 'master'; 
        this.avBuildNumber = tl.getInput('avBuildNumber', false) || 'latest'; 

        // Advanced Task input values
        this.avWorkDirectory = this.getWorkDirectory();
        this.avPipelineIdOutputVariable = this.getPipelineIdOutputVariable();
        this.avAsync = this.getAsync();
                
        // Print/debug task parameters
        tl.debug(`\tavConnectedServiceId = ${this.avConnectedServiceId}`);
        tl.debug(`\tavConnectedServiceNameUrl = ${this.avConnectedServiceNameUrl}`);
        tl.debug(`\tavEndpointAuthScheme = ${this.avEndpointAuthScheme}`);
        tl.debug(`\tavToken = ${this.avToken}`); 
        tl.debug(`\tavBuildUrl = ${this.avBuildUrl}`); 
        tl.debug(`\tavReleaseUrl = ${this.avReleaseUrl}`); 
        tl.debug(`\tavADOProjectId = ${this.avADOProjectId}`);
        tl.debug(`\tavBuildPipelineName = ${this.avBuildPipelineName}`);
        tl.debug(`\tavReleasePipelineName = ${this.avReleasePipelineName}`);
        tl.debug(`\tavPipeline = ${this.avPipeline}`);
        tl.debug(`\tavDescription = ${this.avDescription}`);
        tl.debug(`\tavBranch = ${this.avBranch}`);
        tl.debug(`\tavBuildNumber = ${this.avBuildNumber}`);
        tl.debug(`\tavWorkDirectory = ${this.avWorkDirectory}`);
        tl.debug(`\tAdvanced Group:`);
        tl.debug(`\t\tavAsync = ${this.avAsync}`);
        tl.debug(`\t\tavPipelineIdOutputVariable = ${this.avPipelineIdOutputVariable}`);
    }

    /**
     * Get Connected Service (Service Endpoint) url from environment variables
     */
    private getConnectedServiceUri(connectedService: string): string {
        return tl.getEndpointUrl(connectedService, true) || tl.getInput('avConnectedServiceNameUrl',false);
    }

    /**
     * Get Azure DevOps Build Api Endpoint url from environment variables
     */
    private getBuildEndpointUri(connectedService: string): string {
        return this.getConnectedServiceUri(connectedService);
    }

    /**
     * Get Azure DevOps Release Api Endpoint url from environment variables
     */
    private getReleaseEndpointUri(connectedService: string): string {
        return tl.getEndpointDataParameter(connectedService,'releaseUrl',true) || tl.getInput('avReleaseUrl',false);
    }

        /**
     * Get auth token from environment variables
     */
    private getAuthScheme(connectedService: string): string {
        return tl.getEndpointAuthorizationScheme(connectedService,true) || tl.getInput('avEndpointAuthScheme',false);
    }

    /**
     * Get auth token from environment variables
     * Returns the security token used by the running build.
     * For releases...
     * If no tokens are found, defaults to the Service Endpoint security token.
     */
    private getAccessToken(connectedService: string): string {

        let stoken, btoken, rtoken, dtoken;

        //Debug token
        dtoken = tl.getInput('avToken', false);
        tl.debug(`\tdtoken= ${dtoken}`);

        //Build acess Token
        btoken = tl.getVariable("system.accessToken");
        tl.debug(`\tbtoken= ${btoken}`);
        
        //Release acess Token
        //TODO
        // rtoken = 
        //console.log(`\trtoken= ${rtoken}`);

        //service endpoint access token
        stoken = tl.getEndpointAuthorizationParameter(connectedService,'apitoken',true);
        tl.debug(`\tstoken= ${stoken}`);

        return (btoken || rtoken || stoken) ? (btoken || rtoken || stoken) : dtoken;
        
        // if (auth) {
        //     tl.debug(`\tauth.parameters['AccessToken']= ${auth.parameters['AccessToken']}`);
        //     token = auth.parameters['AccessToken'];
        // }
    }

    /**
     * Get async flag
     */
    private getAsync(): boolean {
        return tl.getBoolInput('avAsync', false);
    }

    /**
     * Get build id output variable
     */
    private getPipelineIdOutputVariable(): string {
        return tl.getInput('avPipelineIdOutputVariable', false);
    }

    /**
     * Get build/release specific work directory
     */
    private getWorkDirectory() {
        return tl.getVariable("Agent.BuildDirectory") || tl.getVariable("Agent.ReleaseDirectory") || path.join(process.cwd(),tl.getInput('avWorkingDirectory'));
    }

}