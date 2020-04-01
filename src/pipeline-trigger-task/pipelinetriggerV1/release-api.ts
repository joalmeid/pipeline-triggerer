import { Release, ReleaseStartMetadata, Artifact } from 'azure-devops-node-api/interfaces/ReleaseInterfaces';
import { IReleaseApi } from 'azure-devops-node-api/ReleaseApi';


export class ReleaseApi {
    constructor(private adoReleasedApi: IReleaseApi) { }

    public getReleases(project: string,definitionId?:number) {
        return this.adoReleasedApi.getReleases(project, definitionId, );
    }

    public getRelease(project: string, releaseId?: number) {
        return this.adoReleasedApi.getRelease(project, releaseId);
    }

    public getReleaseDefinitions(project: string, searchText?: string) {
        return this.adoReleasedApi.getReleaseDefinitions(project, searchText);
    }

    public getReleaseDefinition(project: string, definitionId: number) {
        return this.adoReleasedApi.getReleaseDefinition(project, definitionId);
    }

    public createRelease(releaseStartMetadata: ReleaseStartMetadata, project: string) {
      return this.adoReleasedApi.createRelease(releaseStartMetadata, project);
    }

    public getArtifactVersions(project: string, releaseDefinitionId: number) {
        return this.adoReleasedApi.getArtifactVersions(project, releaseDefinitionId);
        }

    public getArtifactVersionsForSources(artifacts: Artifact[], project: string) {
        return this.adoReleasedApi.getArtifactVersionsForSources(artifacts, project);
    }
}