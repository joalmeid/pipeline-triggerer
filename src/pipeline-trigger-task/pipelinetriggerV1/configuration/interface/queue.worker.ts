
export interface IQueueWorker {
    cachedStatus: boolean;

    queuePipeline();
    getPipelineName();
    getPipelineResult();
    getSuccessStatus();
    getCompletedStatus();
}
