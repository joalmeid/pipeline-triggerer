import tl = require('azure-pipelines-task-lib/task');
import { WebApi, getPersonalAccessTokenHandler } from 'azure-devops-node-api/WebApi';
import { BuildApi } from './build-api';
import { ReleaseApi } from './release-api';

export class AdoApi {

    /**
    * Create Ado Api
    * @param adoApiUri Azure DevOps Api uri
    * @param accessToken OAuth token
    */
    constructor(
        private adoApiUri: string,
        private accessToken: string
    ) { }

    public async getBuildApi(): Promise<BuildApi> {
        let connection = this.createConnection(this.adoApiUri, this.accessToken);
        return new BuildApi(await connection.getBuildApi());
    }

    public async getReleaseApi(): Promise<ReleaseApi> {
        let connection = this.createConnection(this.adoApiUri, this.accessToken);
        return new ReleaseApi(await connection.getReleaseApi());
    }

    private createConnection(adoApiUri: string, accessToken: string): WebApi {
        let creds = getPersonalAccessTokenHandler(accessToken);
        let connection = new WebApi(adoApiUri, creds);

        tl.debug(`\tConnecting to Azure DevOps REST endpoint: ${adoApiUri}`);

        return connection;
    }

}


