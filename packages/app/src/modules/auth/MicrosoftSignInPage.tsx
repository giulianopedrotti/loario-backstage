import { SignInPage } from '@backstage/core-components';
import { microsoftAuthApiRef } from '@backstage/core-plugin-api';
import type { SignInPageProps } from '@backstage/core-plugin-api';

export const MicrosoftSignInPage = (props: SignInPageProps) => (
  <SignInPage
    {...props}
    auto
    provider={{
      id: 'microsoft',
      title: 'Microsoft Entra ID',
      message: 'Entrar com a conta corporativa Loar',
      apiRef: microsoftAuthApiRef,
    }}
  />
);
