import React from 'react';
import { CentralHubOmnibar, CentralHubOmnibarProps } from '../CentralHubOmnibar';

export type AppOmnibarProps = CentralHubOmnibarProps;

export const AppOmnibar: React.FC<AppOmnibarProps> = (props) => {
  return <CentralHubOmnibar {...props} />;
};

export default AppOmnibar;
