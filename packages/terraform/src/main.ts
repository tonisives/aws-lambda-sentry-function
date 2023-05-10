import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput, Lazy } from "cdktf";
// import * as aws from '@cdktf/provider-aws';

import { NodejsFunction } from './lib/nodejs-lambda'
import { addVars } from "./modules/vars";
import { LambdaFunctionConfig, lambdaRolePolicy, REGION, STACK_NAME, LAMBDA_TIMEOUT } from "./config";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { ApiGatewayRestApi } from "@cdktf/provider-aws/lib/api-gateway-rest-api";
import { ApiGatewayDeployment } from "@cdktf/provider-aws/lib/api-gateway-deployment";
import { ApiGatewayStage } from "@cdktf/provider-aws/lib/api-gateway-stage";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { LambdaPermission } from "@cdktf/provider-aws/lib/lambda-permission";
import { ApiGatewayIntegration } from "@cdktf/provider-aws/lib/api-gateway-integration";
import { ApiGatewayResource } from "@cdktf/provider-aws/lib/api-gateway-resource";
import { ApiGatewayMethod } from "@cdktf/provider-aws/lib/api-gateway-method";
import { S3Object } from "@cdktf/provider-aws/lib/s3-object";
import { env } from "./env.example.js";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group/index.js";

class MyStack extends TerraformStack {
  constructor(scope: Construct, stack: string) {
    super(scope, stack);

    new AwsProvider(this, "provider", {
      region: REGION,
    });

    addVars(this)

    // Create unique S3 bucket that hosts Lambda executable
    const bucket = new S3Bucket(this, "bucket", {
      bucketPrefix: `${stack}`,
    });

    // Create and configure API gateway
    const api = new ApiGatewayRestApi(this, `${stack}-api-gw`, {
      name: stack,
      endpointConfiguration: {
        types: ["REGIONAL"]
      }
    })

    let lambdas = [
      this.addLambda(bucket, api, {
        name: `${stack}-store`,
        path: `../../store/dist`,
        handler: "index.handler",
        runtime: "nodejs18.x",
        version: "v0.0.1"
      })
    ]

    const deployment = new ApiGatewayDeployment(this, `${stack}-deployment`, {
      restApiId: api.id,
      dependsOn: lambdas.flatMap(it => it.integrations),
      lifecycle: {
        createBeforeDestroy: true,
      },
      triggers: {
        // Trigger redeployment when lambdas added/removed
        redeployment: Lazy.stringValue({
          produce: () => {
            return lambdas.length.toString();
          },
        }),
      }
    })

    const stage = new ApiGatewayStage(this, `${stack}-stage`, {
      restApiId: api.id,
      deploymentId: deployment.id,
      stageName: "prod",
    })

    lambdas.map(it => {
      return { proxy: it.proxy, config: it.config }
    }).forEach((lambda) => {
      new TerraformOutput(this, `${stack}-${lambda.config.name}`, {
        value: `${deployment.invokeUrl}${stage.stageName}${lambda.proxy.path}`,
      })
    })
  }

  addLambda(bucket: S3Bucket, api: ApiGatewayRestApi, config: LambdaFunctionConfig) {
    const nameWithoutStack = config.name.replace(`${STACK_NAME}-`, "")
    const nodeJsFunction = new NodejsFunction(this, `${config.name}-nodejs`, {
      handler: 'index.foo',
      path: `../${nameWithoutStack}`
    })

    // this changes if code is changed.
    let hash = nodeJsFunction.asset.assetHash.slice(0, 8)

    // Upload Lambda zip file to newly created S3 bucket
    const lambdaArchive = new S3Object(this, `${config.name}-lambda-archive-${hash}`, {
      bucket: bucket.bucket,
      key: `${config.name}-lambda-archive-${nodeJsFunction.asset.assetHash}`,
      source: nodeJsFunction.asset.path, // returns a posix path
    });

    // Create Lambda role
    const role = new IamRole(this, `${config.name}-role`, {
      name: `${config.name}`,
      assumeRolePolicy: JSON.stringify(lambdaRolePolicy)
    })

    new CloudwatchLogGroup(this, `${config.name}-log-group`, {
      name: `/aws/lambda/${config.name}`,
      retentionInDays: 7
    })

    // Add execution role for lambda to write to CloudWatch logs
    new IamRolePolicyAttachment(this, `${config.name}-policy`, {
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      role: role.name
    })

    // Create Lambda function
    const lambdaFunc = new LambdaFunction(this, `${config.name}-lambda`, {
      functionName: `${config.name}`,
      s3Bucket: bucket.bucket,
      s3Key: lambdaArchive.key,
      handler: config.handler,
      runtime: config.runtime,
      role: role.arn,
      timeout: LAMBDA_TIMEOUT,
      environment: {
        variables: {
          ...env
        }
      }
    });

    // create path with API gateway 
    const { integrations, proxy } = this.addPath(config.name, nameWithoutStack, api, lambdaFunc);

    // add permission to invoke lambda from API gateway
    new LambdaPermission(this, `${config.name}-apigw-permission`, {
      functionName: lambdaFunc.functionName,
      action: "lambda:InvokeFunction",
      principal: "apigateway.amazonaws.com",
      sourceArn: `${api.executionArn}/*/*`,
    })

    return { integrations, proxy, nodeJsFunction, config }
  }

  addPath(name: string, path: string, api: ApiGatewayRestApi, lambdaFunc: LambdaFunction, parentId: string = api.rootResourceId): { integrations: ApiGatewayIntegration[], proxy: ApiGatewayResource } {
    const proxy = new ApiGatewayResource(this, `${name}-proxy`, {
      restApiId: api.id,
      parentId: parentId,
      pathPart: `${path}`,
    });

    const proxyMethod = new ApiGatewayMethod(this, `${name}-proxy-method`, {
      restApiId: api.id,
      resourceId: proxy.id,
      authorization: 'NONE',
      httpMethod: 'ANY',
    });

    const integration = new ApiGatewayIntegration(this, `${name}-proxy-integration`, {
      httpMethod: proxyMethod.httpMethod,
      resourceId: proxy.id,
      restApiId: api.id,
      type: 'AWS_PROXY',
      integrationHttpMethod: 'POST',
      uri: lambdaFunc.invokeArn
    });

    // add proxy path
    if (path !== '{proxy+}') {
      let proxyIntegration = this.addPath(`${name}-p`, '{proxy+}', api, lambdaFunc, proxy.id)
      return { integrations: [integration, proxyIntegration?.integrations[0]], proxy };
    }

    return { integrations: [integration], proxy };

  }
}

const app = new App();

new MyStack(app, STACK_NAME)

app.synth();
