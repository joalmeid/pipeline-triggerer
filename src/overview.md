## Pipeline Triggerer Extension ##

This extension allows you to trigger any existing build or release definition. No matter if its implemented with the Classic Editor or YAML pipelines.
This is usefull when you need to orchestrate one or several pipelines from your authored pipeline.

![Extension ADO Pipeline Triggerer Task in Yaml](https://user-images.githubusercontent.com/4800035/78352154-d3177080-759f-11ea-82ac-f70065b90022.png)

### Highlights ###
> This extension is ***cross platform***. You can run it from **Windows**, **Linux** or **macOS** self-hosted agents.
> This extension allows you to orchestrate pipelines accross different **projects** or **organizations**

The Pipeline Triggerer Extension include the following contributions:

1. Pipeline Triggerer Task

![Extension ADO Pipeline Triggerer Task](https://user-images.githubusercontent.com/4800035/78352157-d3b00700-759f-11ea-86c8-5b8884362141.png)

2. Azure Devops Service Connection

![Extension ADO Service EndPoint](https://user-images.githubusercontent.com/4800035/78352156-d3177080-759f-11ea-83d9-5df548b4487d.png)

Don't know how to get started? Well it's easy as:
  1. Create your Service Endpoint
  2. Add the `Pipeline Triggerer Task` to any of your build or release pipelines
  3. Configure the `Pipeline Triggerer Task`
  4. Run your pipeline!

![Adding Extension ADO Pipeline Trigger Task](https://user-images.githubusercontent.com/4800035/78352152-d27eda00-759f-11ea-9238-d897ff7d81ac.png)

### Prerequisites ###
- You must have an active Azure subscription. Create a new subscription at https://azure.com.
- You must also have an active Azure DevOps account and an organization. Create a new account at https://dev.azure.com.
- Install this extension to your organization. To do this, you must be an admin of the organization. 
  - Once installed, you may have to have your admin make the extension available to you or your project.
- Create a service connection to your Azure Devops Organization in your DevOps project.

The name of this service connection is what you will use in the `Pipeline Triggerer Task` for the input *'Azure DevOps service connection'* if you are using the Classical Editor. If you're authoring YAML pipelines, it's the input `adoConnectedServiceName`.

### Quick steps to get started ###

To make the Pipeline Triggerer Task available, you must:
- Configure a service end-point in Azure DevOps for accessing the ADO Rest Api;
- Use the Pipeline Triggerer Task in your build/release definitions.

### Pipeline Triggerer Task ###

```yaml
# Pipeline Triggerer Task
# Trigger any build or release definition in any organization/project
- task: pipeline-triggerer-task@0
  inputs:
    #adoServiceConnection: The Azure DevOps Organization service connection that should be used to connect to Azure DevOps. # Required. 
    #Project: Name of the team project were the pipeline resides. # Required. 
    #PipelineType: The type of pipeline # Required.  Options: Build, Release
    #BuildDefinition: The name of the Build to trigger. # Required when PipelineType == Build. 
    #ReleaseDefinition: The name of the Release to trigger. # Required when PipelineType == Release. 
    #ReleaseDescription: The description of the release. # Optional. 
    #Branch: The name of the branch to build. When kept empty the default branch of the build will be used. # Optional.
    #BuildNumber: The succeeded build number to release of the primary artifact. When kept empty the latest version is used. # Optional.
    #Async: The async flag defines whether the build task waits till the builds are finished or just queues them. # Optional.
    #PipelineIdOutputVariable: Variable name used to write the resulting build/release id's. # Optional.
```