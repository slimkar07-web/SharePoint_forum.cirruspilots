import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface ICopaHomePageProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  userDisplayName: string;
  context: WebPartContext;
}
