import { createApp } from '@backstage/frontend-defaults';
import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { SignInPageBlueprint } from '@backstage/plugin-app-react';
import authPlugin from '@backstage/plugin-auth';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { MicrosoftSignInPage } from './modules/auth';
import { navModule } from './modules/nav';

const microsoftSignInPage = SignInPageBlueprint.make({
  params: {
    loader: async () => MicrosoftSignInPage,
  },
});

const authModule = createFrontendModule({
  pluginId: 'app',
  extensions: [microsoftSignInPage],
});

export default createApp({
  features: [authModule, authPlugin, catalogPlugin, navModule],
});
