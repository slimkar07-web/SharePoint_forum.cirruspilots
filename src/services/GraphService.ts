import { WebPartContext } from '@microsoft/sp-webpart-base';
import { MSGraphClientV3 } from '@microsoft/sp-http';
import { IPoster } from '../models/ITopic';

export class GraphService {
  private context: WebPartContext;

  constructor(context: WebPartContext) {
    this.context = context;
  }

  /**
   * Fetches the user profile and photo from Microsoft Graph API.
   * Assumes internal users since external users are disabled.
   * @param email User's email or UPN
   */
  public async getUserWithAvatar(email: string): Promise<IPoster> {
    const client: MSGraphClientV3 = await this.context.msGraphClientFactory.getClient('3');

    try {
      // Get User Display Name
      const userRes = await client.api(`/users/${email}`).select('displayName,id,mail').get();
      
      let avatarUrl = '';
      try {
        // Get User Photo
        const photoRes = await client.api(`/users/${email}/photo/$value`).responseType('blob' as any).get();
        avatarUrl = URL.createObjectURL(photoRes);
      } catch (photoError) {
        // User might not have a photo, fallback to empty string (Persona component will show initials)
        console.log(`No photo found for ${email}`);
      }

      return {
        id: userRes.id,
        displayName: userRes.displayName,
        email: userRes.mail,
        avatarUrl: avatarUrl
      };
    } catch (error) {
      console.error(`Error fetching user profile for ${email}`, error);
      return {
        id: email,
        displayName: email,
        email: email
      };
    }
  }
}
