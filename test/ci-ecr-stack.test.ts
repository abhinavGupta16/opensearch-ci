/**
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import {
  expect, countResources, haveResourceLike, ResourcePart,
} from '@aws-cdk/assert';
import { App, RemovalPolicy } from '@aws-cdk/core';
import { CiEcrStack } from '../lib/ci-ecr-stack';
import { DeployAssetsProps, DeployAwsAssets } from '../lib/deploy-aws-assets';

test('ECR Stack with Resources', () => {
  const app = new App({
    context: { useSsl: 'true', runWithOidc: 'true' },
  });

  // WHEN
  const deployAssetsProps : DeployAssetsProps = {
    removalPolicy: RemovalPolicy.DESTROY,
    mainNodeAccountNumber: '99999999',
    envName: 'dev',
    env: {
      region: 'us-east-1',
    },
    deployECR: false,
    repositories: [
      'opensearch',
      'opensearch-dashboards',
    ],
  };

  const deployAwsAssetsStack = new DeployAwsAssets(app, 'TestStack', deployAssetsProps);

  const ecrStack = new CiEcrStack(deployAwsAssetsStack, 'ecrStack', deployAssetsProps);

  // THEN
  expect(ecrStack).to(countResources('AWS::IAM::Role', 1));
  expect(ecrStack).to(countResources('AWS::IAM::ManagedPolicy', 1));
});

test('ECR Stack No ECR Repositories', () => {
  const app = new App({
    context: { useSsl: 'true', runWithOidc: 'true' },
  });

  // WHEN
  const deployAssetsProps : DeployAssetsProps = {
    removalPolicy: RemovalPolicy.DESTROY,
    mainNodeAccountNumber: '99999999',
    envName: 'dev',
    env: {
      region: 'us-east-1',
    },
    deployECR: false,
  };

  const deployAwsAssetsStack = new DeployAwsAssets(app, 'TestStack', deployAssetsProps);

  const ecrStack = new CiEcrStack(deployAwsAssetsStack, 'ecrStack', deployAssetsProps);

  // THEN
  expect(ecrStack).to(countResources('AWS::ECR::PublicRepository', 0));
  expect(deployAwsAssetsStack).to(countResources('AWS::ECR::PublicRepository', 0));
  expect(ecrStack).to(countResources('AWS::IAM::Role', 1));
  expect(ecrStack).to(countResources('AWS::IAM::ManagedPolicy', 1));
  expect(deployAwsAssetsStack).to(countResources('AWS::CloudFormation::Stack', 1));
});

test('Test ecr role', () => {
  const app = new App({
    context: { useSsl: 'true', runWithOidc: 'true' },
  });

  // WHEN
  const deployAssetsProps : DeployAssetsProps = {
    removalPolicy: RemovalPolicy.DESTROY,
    mainNodeAccountNumber: '99999999',

    envName: 'dev',
    env: {
      region: 'us-east-1',
    },
    deployECR: false,
  };

  const deployAwsAssetsStack = new DeployAwsAssets(app, 'TestStack', deployAssetsProps);

  const ecrStack = new CiEcrStack(deployAwsAssetsStack, 'ecrStack', deployAssetsProps);

  // THEN
  expect(ecrStack).to(haveResourceLike('AWS::IAM::Role', {
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            AWS: 'arn:aws:iam::99999999:role/OpenSearch-CI-MainNodeRole',
          },
        },
      ],
      Version: '2012-10-17',
    },
    ManagedPolicyArns: [
      {
        Ref: 'ecrpolicy6AF4FDB9',
      },
    ],
    RoleName: 'OpenSearch-CI-ECR-ecr-role',
  }));
});

test('Test ECR Policy', () => {
  const app = new App({
    context: { useSsl: 'true', runWithOidc: 'true' },
  });

  // WHEN
  const deployAssetsProps : DeployAssetsProps = {
    removalPolicy: RemovalPolicy.DESTROY,
    mainNodeAccountNumber: '99999999',

    envName: 'dev',
    env: {
      region: 'us-east-1',
    },
    deployECR: false,
  };

  const deployAwsAssetsStack = new DeployAwsAssets(app, 'TestStack', deployAssetsProps);

  const ecrStack = new CiEcrStack(deployAwsAssetsStack, 'ecrStack', deployAssetsProps);

  // THEN
  expect(ecrStack).to(haveResourceLike('AWS::IAM::ManagedPolicy', {
    PolicyDocument: {
      Statement: [
        {
          Action: [
            'ecr-public:BatchCheckLayerAvailability',
            'ecr-public:CompleteLayerUpload',
            'ecr-public:InitiateLayerUpload',
            'ecr-public:PutImage',
            'ecr-public:UploadLayerPart',
          ],
          Effect: 'Allow',
          Resource: '*',
        },
        {
          Action: [
            'ecr-public:GetAuthorizationToken',
            'sts:GetServiceBearerToken',
          ],
          Effect: 'Allow',
          Resource: '*',
        },
      ],
      Version: '2012-10-17',
    },
    Description: 'Policy for uploading images to ECR',
    ManagedPolicyName: 'ecrStack-ecr-policy',
    Path: '/',
  }, ResourcePart.Properties));
});
