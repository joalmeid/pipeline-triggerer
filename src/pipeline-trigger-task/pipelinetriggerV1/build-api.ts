import { Build, BuildArtifact } from "azure-devops-node-api/interfaces/BuildInterfaces";
import { IBuildApi } from "azure-devops-node-api/BuildApi";

export class BuildApi {
    constructor(private adoBuildApi: IBuildApi) { }

    public queueBuild(build: Build, project: string, ignoreWarnings: boolean) {
        return this.adoBuildApi.queueBuild(build, project, ignoreWarnings);
    }

    public getDefinitions(project: string, definitionName?:string) {
        return this.adoBuildApi.getDefinitions(project, definitionName);
    }

    public getBuild(buildId: number, projectId: string) {
        return this.adoBuildApi.getBuild(buildId, projectId);
    }

    public getBuildArtifact(buildId: number, projectId: string)  {
        return this.adoBuildApi.getArtifact(buildId, projectId);
    }

    public getBuildArtifacts(buildId: number, projectId: string) {
        return this.adoBuildApi.getArtifacts(buildId, projectId);
    }
}