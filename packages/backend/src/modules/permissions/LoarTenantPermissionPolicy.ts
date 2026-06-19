import {
  RESOURCE_TYPE_CATALOG_ENTITY,
  catalogEntityReadPermission,
} from '@backstage/plugin-catalog-common/alpha';
import {
  catalogConditions,
  createCatalogConditionalDecision,
} from '@backstage/plugin-catalog-backend/alpha';
import {
  AuthorizeResult,
  isPermission,
  isResourcePermission,
} from '@backstage/plugin-permission-common';
import {
  PermissionPolicy,
  PolicyQuery,
  PolicyQueryUser,
} from '@backstage/plugin-permission-node';

const TENANT_ANNOTATION = 'loartec.io/tenant-slug';
const PLATFORM_ADMIN_GROUP = 'group:default/sg-loar-platform-backstage-admins';

function ownershipRefs(user?: PolicyQueryUser): string[] {
  return user?.info.ownershipEntityRefs ?? [];
}

function isPlatformAdmin(user?: PolicyQueryUser): boolean {
  return ownershipRefs(user).includes(PLATFORM_ADMIN_GROUP);
}

function tenantFromOwnershipRef(ref: string): string | undefined {
  const match = ref.match(/^group:default\/tenant-([a-z0-9-]+)$/);
  return match?.[1];
}

function tenantsForUser(user?: PolicyQueryUser): string[] {
  return [
    ...new Set(
      ownershipRefs(user)
        .map(tenantFromOwnershipRef)
        .filter((tenant): tenant is string => Boolean(tenant)),
    ),
  ];
}

export class LoarTenantPermissionPolicy implements PermissionPolicy {
  async handle(request: PolicyQuery, user?: PolicyQueryUser) {
    if (!user) {
      return { result: AuthorizeResult.DENY };
    }

    if (isPlatformAdmin(user)) {
      return { result: AuthorizeResult.ALLOW };
    }

    if (
      isPermission(request.permission, catalogEntityReadPermission) &&
      isResourcePermission(request.permission, RESOURCE_TYPE_CATALOG_ENTITY)
    ) {
      const tenants = tenantsForUser(user);

      if (tenants.length === 0) {
        return { result: AuthorizeResult.DENY };
      }

      return createCatalogConditionalDecision(request.permission, {
        anyOf: tenants.map(tenant =>
          catalogConditions.hasAnnotation({
            annotation: TENANT_ANNOTATION,
            value: tenant,
          }),
        ) as [
          ReturnType<typeof catalogConditions.hasAnnotation>,
          ...ReturnType<typeof catalogConditions.hasAnnotation>[],
        ],
      });
    }

    return { result: AuthorizeResult.DENY };
  }
}
