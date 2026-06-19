import { createBackendModule } from '@backstage/backend-plugin-api';
import {
  AuthResolverContext,
  OAuthAuthenticatorResult,
  PassportProfile,
  SignInInfo,
  authProvidersExtensionPoint,
  createOAuthProviderFactory,
} from '@backstage/plugin-auth-node';
import { microsoftAuthenticator } from '@backstage/plugin-auth-backend-module-microsoft-provider';

type LoarTenantRole = 'user' | 'admin' | 'platform-admin';

type LoarTenantGroupMapping = {
  objectId?: string;
  groupName: string;
  tenant: string;
  role: LoarTenantRole;
};

const LOAR_TENANT_GROUPS: LoarTenantGroupMapping[] = [
  {
    objectId: 'e94db1e8-0da5-468c-a60b-eb28370c19cc',
    groupName: 'sg-loar-dev-backstage-users',
    tenant: 'loartec',
    role: 'user',
  },
  {
    objectId: '03368a72-3664-42fd-bf07-09ea1946075d',
    groupName: 'sg-loar-dev-backstage-admins',
    tenant: '*',
    role: 'platform-admin',
  },
  {
    objectId: '3d70e573-17d5-468f-94b1-b3b90dda3932',
    groupName: 'sg-loar-loartec-backstage-users',
    tenant: 'loartec',
    role: 'user',
  },
  {
    objectId: '251e9c7c-522e-4bbc-b379-b23f249b4bb8',
    groupName: 'sg-loar-loartec-backstage-admins',
    tenant: 'loartec',
    role: 'admin',
  },
  {
    objectId: 'a78e9482-c62d-4327-8d65-f672b9f0c8a7',
    groupName: 'sg-loar-platform-backstage-admins',
    tenant: '*',
    role: 'platform-admin',
  },
];

function decodeJwtPayload(token?: string): Record<string, unknown> {
  if (!token) {
    return {};
  }

  const [, payload] = token.split('.');
  if (!payload) {
    return {};
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return {};
  }
}

function toUserEntityName(email: string): string {
  return email
    .split('@')[0]
    .toLocaleLowerCase('en-US')
    .replace(/[^a-z0-9_.-]/g, '-');
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function groupEntityRef(groupName: string): string {
  return `group:default/${groupName}`;
}

function tenantEntityRef(tenant: string): string {
  return `group:default/tenant-${tenant}`;
}

function roleEntityRef(tenant: string, role: LoarTenantRole): string {
  return `group:default/tenant-${tenant}-${role}`;
}

function groupsFromClaims(claims: Record<string, unknown>): string[] {
  const rawGroups = claims.groups;
  if (!Array.isArray(rawGroups)) {
    return [];
  }
  return rawGroups.filter((group): group is string => typeof group === 'string');
}

function resolveGroupMappings(groups: string[]): LoarTenantGroupMapping[] {
  const normalizedGroups = new Set(
    groups.map(group => group.toLocaleLowerCase('en-US')),
  );

  return LOAR_TENANT_GROUPS.filter(mapping => {
    return (
      (mapping.objectId &&
        normalizedGroups.has(mapping.objectId.toLocaleLowerCase('en-US'))) ||
      normalizedGroups.has(mapping.groupName.toLocaleLowerCase('en-US'))
    );
  });
}

async function loarMicrosoftSignInResolver(
  info: SignInInfo<OAuthAuthenticatorResult<PassportProfile>>,
  ctx: AuthResolverContext,
) {
  const email =
    info.profile.email ??
    info.result.fullProfile.email ??
    info.result.fullProfile.emails?.[0]?.value;

  if (!email?.toLocaleLowerCase('en-US').endsWith('@loartec.io')) {
    throw new Error('Microsoft profile email is not in the loartec.io domain');
  }

  const claims = decodeJwtPayload(info.result.session.idToken);
  const mappedGroups = resolveGroupMappings(groupsFromClaims(claims));

  if (mappedGroups.length === 0) {
    throw new Error(
      'User is not mapped to any Loar Backstage tenant group in the Microsoft token',
    );
  }

  const userEntityRef = `user:default/${toUserEntityName(email)}`;
  const ownershipEntityRefs = unique([
    userEntityRef,
    ...mappedGroups.map(group => groupEntityRef(group.groupName)),
    ...mappedGroups
      .filter(group => group.tenant !== '*')
      .map(group => tenantEntityRef(group.tenant)),
    ...mappedGroups
      .filter(group => group.tenant !== '*')
      .map(group => roleEntityRef(group.tenant, group.role)),
    ...mappedGroups
      .filter(group => group.role === 'platform-admin')
      .map(() => groupEntityRef('sg-loar-platform-backstage-admins')),
  ]);

  return ctx.issueToken({
    claims: {
      sub: userEntityRef,
      ent: ownershipEntityRefs,
    },
  });
}

export default createBackendModule({
  pluginId: 'auth',
  moduleId: 'loar-microsoft-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        providers: authProvidersExtensionPoint,
      },
      async init({ providers }) {
        providers.registerProvider({
          providerId: 'microsoft',
          factory: createOAuthProviderFactory({
            authenticator: microsoftAuthenticator,
            signInResolver: loarMicrosoftSignInResolver,
          }),
        });
      },
    });
  },
});
