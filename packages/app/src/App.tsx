import { createApp } from '@backstage/frontend-defaults';
import authPlugin from '@backstage/plugin-auth';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { navModule } from './modules/nav';

export default createApp({
  features: [authPlugin, catalogPlugin, navModule],
});
