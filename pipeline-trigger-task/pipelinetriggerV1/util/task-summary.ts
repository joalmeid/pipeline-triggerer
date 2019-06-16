import path = require('path');
import fs = require('fs');

import { IQueueWorker } from '../configuration/interface';
import { ReleaseWorker } from '../queue-release.worker';
import { BuildWorker } from '../queue-build.worker';
import { TaskOptions } from '../configuration';

export abstract class TaskSummary {
    public static attach(
        pipeline: IQueueWorker,
        taskOptions: TaskOptions
    ) {
        if (taskOptions == null || taskOptions.avWorkDirectory == null) {
            return;
        }
        var filepath = path.join(taskOptions.avWorkDirectory, `QueueBuild-BuildResult.html`);

        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        fs.writeFileSync(filepath, TaskSummary.getSummary(pipeline, taskOptions));

        console.log(`##vso[task.addattachment type=Distributedtask.Core.Summary;name=Queued Pipelines;]${filepath}`);
        console.log('\tQueued pipelines linked to pipeline result');
    }

    private static getSummary(
        pipeline: IQueueWorker,
        taskOptions: TaskOptions
    ): string {
        let summary = '';
        let baseIconDefinition = `style="vertical-align:top" class="icon bowtie-icon`;

        summary += `<div style="padding: 3px 0">\n`;

        let pipelineResult = pipeline.getPipelineResult();

        // Invalid build
        if (pipelineResult == null) {
            summary += `<span ${baseIconDefinition} build-failure-icon-color bowtie-edit-delete" aria-label="failed" title="Invalid"></span><span>${pipeline.getPipelineName()}</span>\n`;
        }

        // Valid build
        else {
            if (taskOptions != null && taskOptions.avAsync === true) {
                summary += `<span ${baseIconDefinition} build-brand-icon-color bowtie-play-fill" aria-label="started" title="Started"></span>\n`;
            }
            else {
                if (pipeline.getSuccessStatus() === true) {
                    summary += `<span ${baseIconDefinition} build-success-icon-color bowtie-check" aria-label="succeeded" title="Succeeded"></span>\n`;
                }
                else {
                    summary += `<span ${baseIconDefinition} build-failure-icon-color bowtie-edit-delete" aria-label="failed" title="Failed"></span>\n`;
                }
            }

            pipeline instanceof BuildWorker 
                ? summary += `<a href="${pipelineResult._links.web.href}">${pipelineResult.definition.name}</a>\n`
                : summary += `Pipeline ${pipelineResult.releaseDefinition.name}, release: <a href="${pipelineResult.url}">${pipelineResult.name}</a>\n`;
        }

        summary += `</div>\n`;

        return summary;
    }
}