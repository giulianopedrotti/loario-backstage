import { createBackendModule } from '@backstage/backend-plugin-api';
import { policyExtensionPoint } from '@backstage/plugin-permission-node/alpha';
import { LoarTenantPermissionPolicy } from './LoarTenantPermissionPolicy';

export default createBackendModule({
  pluginId: 'permission',
  moduleId: 'loar-tenant-policy',
  register(reg) {
    reg.registerInit({
      deps: {
        policy: policyExtensionPoint,
      },
      async init({ policy }) {
        policy.setPolicy(new LoarTenantPermissionPolicy());
      },
    });
  },
});
