/**
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { JenkinsMainNode } from '../../lib/compute/jenkins-main-node';

describe('JenkinsMainNode Config Elements', () => {
  // WHEN
  const configElements = JenkinsMainNode.configElements('MyTestStack', 'us-west-2', {
    redirectUrlArn: 'ARN:ABC',
    sslCertContentsArn: 'ARN:BCD',
    sslCertPrivateKeyContentsArn: 'ARN:CDE',
    sslCertChainArn: 'ARN:DEF',
    useSsl: true,
  }, {
    oidcCredArn: 'ARN:DEF',
    runWithOidc: false,
  });

  // THEN
  test('Config elements expected counts', async () => {
    expect(configElements.filter((e) => e.elementType === 'COMMAND')).toHaveLength(35);
    expect(configElements.filter((e) => e.elementType === 'PACKAGE')).toHaveLength(14);
    expect(configElements.filter((e) => e.elementType === 'FILE')).toHaveLength(3);
  });

  test('Does not use service in config elements', async () => {
    expect(configElements.filter((e) => e.elementType === 'SERVICE')).toHaveLength(0);
  });
});

test('Verify config.xml fields for jenkins OIDC', async () => {
  expect(JenkinsMainNode.oidcConfigFields()).toBeInstanceOf(Array);

  const oidcConfigFields : string[][] = [['clientId', 'replace'],
    ['clientSecret', 'replace'],
    ['wellKnownOpenIDConfigurationUrl', 'replace'],
    ['tokenServerUrl', 'replace'],
    ['authorizationServerUrl', 'replace'],
    ['userInfoServerUrl', 'replace'],
    ['userNameField', 'sub'],
    ['scopes', 'openid'],
    ['disableSslVerification', 'false'],
    ['logoutFromOpenidProvider', 'true'],
    ['postLogoutRedirectUrl', ''],
    ['escapeHatchEnabled', 'false'],
    ['escapeHatchSecret', 'random']];

  expect(JSON.stringify(JenkinsMainNode.oidcConfigFields()) === JSON.stringify(oidcConfigFields)).toBeTruthy();
});

test('createPluginInstallCommands breaks apart many plugins', async () => {
  const plugins = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `${n}`);
  const commands = JenkinsMainNode.createPluginInstallCommands(plugins);
  expect(commands).toHaveLength(2);
});

test('createPluginInstallCommands works with one plugin', async () => {
  const plugins = ['0'];
  const commands = JenkinsMainNode.createPluginInstallCommands(plugins);
  expect(commands).toHaveLength(1);
});
