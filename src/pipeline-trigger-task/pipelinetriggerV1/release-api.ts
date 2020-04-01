import { Release, ReleaseStartMetadata, Artifact } from 'azure-devops-node-api/interfaces/ReleaseInterfaces';
import { IReleaseApi } from 'azure-devops-node-api/ReleaseApi';


export class ReleaseApi {
    constructor(private adoReleasedApi: IReleaseApi) { }

    public getReleases(project: string,definitionId?:number) {
        return this.adoReleasedApi.getReleases(project, definitionId, );
        // getReleases(project?: string, definitionId?: number, definitionEnvironmentId?: number, searchText?: string, createdBy?: string, statusFilter?: ReleaseInterfaces.ReleaseStatus, environmentStatusFilter?: number, minCreatedTime?: Date, maxCreatedTime?: Date, queryOrder?: ReleaseInterfaces.ReleaseQueryOrder, top?: number, continuationToken?: number, expand?: ReleaseInterfaces.ReleaseExpands, artifactTypeId?: string, sourceId?: string, artifactVersionId?: string, sourceBranchFilter?: string, isDeleted?: boolean, tagFilter?: string[], propertyFilters?: string[], releaseIdFilter?: number[]): Promise<ReleaseInterfaces.Release[]>;
    }

    public getRelease(project: string, releaseId?: number) {
        return this.adoReleasedApi.getRelease(project, releaseId);
        // getRelease(project: string, releaseId: number, approvalFilters?: ReleaseInterfaces.ApprovalFilters, propertyFilters?: string[], expand?: ReleaseInterfaces.SingleReleaseExpands, topGateRecords?: number): Promise<ReleaseInterfaces.Release>;
    }

    public getReleaseDefinitions(project: string, searchText?: string) {
        return this.adoReleasedApi.getReleaseDefinitions(project, searchText);
        // getReleaseDefinitions(project: string, searchText?: string, expand?: ReleaseInterfaces.ReleaseDefinitionExpands, artifactType?: string, artifactSourceId?: string, top?: number, continuationToken?: string, queryOrder?: ReleaseInterfaces.ReleaseDefinitionQueryOrder, path?: string, isExactNameMatch?: boolean, tagFilter?: string[], propertyFilters?: string[], definitionIdFilter?: string[], isDeleted?: boolean): Promise<ReleaseInterfaces.ReleaseDefinition[]>;
    }

    public getReleaseDefinition(project: string, definitionId: number) {
        return this.adoReleasedApi.getReleaseDefinition(project, definitionId);
        // getReleaseDefinition(project: string, definitionId: number, propertyFilters?: string[]): Promise<ReleaseInterfaces.ReleaseDefinition>;
    }

    public createRelease(releaseStartMetadata: ReleaseStartMetadata, project: string) {
        return this.adoReleasedApi.createRelease(releaseStartMetadata, project);
    }

    public getArtifactVersions(project: string, releaseDefinitionId: number) {
        return this.adoReleasedApi.getArtifactVersions(project, releaseDefinitionId);
        // getArtifactVersions(project: string, releaseDefinitionId: number): Promise<ReleaseInterfaces.ArtifactVersionQueryResult>;
        }

    public getArtifactVersionsForSources(artifacts: Artifact[], project: string) {
        return this.adoReleasedApi.getArtifactVersionsForSources(artifacts, project);
        // getArtifactVersionsForSources(artifacts: ReleaseInterfaces.Artifact[], project: string): Promise<ReleaseInterfaces.ArtifactVersionQueryResult>;
    }
}