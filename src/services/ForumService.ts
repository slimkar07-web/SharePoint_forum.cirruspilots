import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { Environment, EnvironmentType } from '@microsoft/sp-core-library';
import { ITopic } from '../models/ITopic';
import { ICategory } from '../models/ICategory';
import { IReply } from '../models/IReply';

export class ForumService {
  private context: WebPartContext;
  private siteUrl: string;

  constructor(context: WebPartContext) {
    this.context = context;
    this.siteUrl = context.pageContext.web.absoluteUrl;
  }



  public async getCategories(): Promise<ICategory[]> {
    const listName = 'ForumCategories';
    const query = `${this.siteUrl}/_api/web/lists/getByTitle('${listName}')/items?$select=Id,Title,Description,ColorHex,IconName`;

    try {
      const response: SPHttpClientResponse = await this.context.spHttpClient.get(query, SPHttpClient.configurations.v1);
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch categories: ${response.status} - ${errText}`);
      }

      const data = await response.json();

      if (!data.value || data.value.length === 0) {
        return []; // Return empty if there are no categories yet
      }

      return data.value.map((item: any) => ({
        id: item.Id,
        title: item.Title,
        description: item.Description,
        colorHex: item.ColorHex || '#999999',
        iconName: item.IconName
      }));
    } catch (error) {
      console.error('Error fetching categories from SharePoint list', error);
      return []; // Return empty on error
    }
  }

  public async getTopics(categoryName: string): Promise<ITopic[]> {
    const listName = 'ForumTopics'; 
    let filterQuery = '';
    if (categoryName && categoryName !== 'All Categories') {
      filterQuery = `&$filter=Category/Title eq '${categoryName}'`;
    }

    // Safely removed LastActivity, IsLocked, IsPinned, Tags from $select just in case they are missing from the list schema. We will sort by Modified instead.
    const query = `${this.siteUrl}/_api/web/lists/getByTitle('${listName}')/items?$select=Id,Title,Body,Modified,Category/Title,Author/EMail,Author/Title&$expand=Author,Category${filterQuery}&$orderby=Modified desc`;

    try {
      const response: SPHttpClientResponse = await this.context.spHttpClient.get(query, SPHttpClient.configurations.v1);
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch topics: ${response.status} - ${errText}`);
      }

      const data = await response.json();

      if (!data.value || data.value.length === 0) {
        return []; // Return empty if list is empty
      }

      return data.value.map((item: any) => ({
        id: item.Id,
        title: item.Title,
        url: `https://forum.cirruspilots.org/t/${item.Id}`,
        repliesCount: item.RepliesCount || 0,
        viewsCount: item.ViewsCount || 0,
        lastActivity: new Date(item.Modified || new Date()),
        category: item.Category?.Title,
        isLocked: false,
        isPinned: false,
        body: item.Body,
        likesCount: item.LikesCount || 0,
        currentUserLiked: false,
        tags: [],
        posters: [
          {
            id: item.Author?.EMail || item.Id.toString(),
            displayName: item.Author?.Title || 'Unknown User',
            email: item.Author?.EMail
          }
        ]
      }));
    } catch (error) {
      console.error('Error fetching topics from SharePoint list', error);
      return []; // Return empty on error
    }
  }

  public async getReplies(topicId: number): Promise<IReply[]> {
    const listName = 'ForumReplies'; 
    const query = `${this.siteUrl}/_api/web/lists/getByTitle('${listName}')/items?$select=Id,Title,Body,LikesCount,IsAcceptedAnswer,Author/EMail,Author/Title,Created&$expand=Author&$filter=TopicId eq ${topicId}&$orderby=Created asc`;

    try {
      const response: SPHttpClientResponse = await this.context.spHttpClient.get(query, SPHttpClient.configurations.v1);
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch replies: ${response.status} - ${errText}`);
      }

      const data = await response.json();

      if (!data.value || data.value.length === 0) {
        return []; // Return empty if there are no replies yet
      }

      return data.value.map((item: any) => ({
        id: item.Id,
        title: item.Title,
        topicId: topicId,
        body: item.Body,
        isAcceptedAnswer: !!item.IsAcceptedAnswer,
        authorName: item.Author?.Title || 'Unknown User',
        authorEmail: item.Author?.EMail,
        createdDate: new Date(item.Created),
        likesCount: item.LikesCount || 0,
        currentUserLiked: false // Mocked for now
      }));
    } catch (error) {
      console.error('Error fetching replies from SharePoint list', error);
      return [];
    }
  }

  public async createTopic(topic: Partial<ITopic>, files?: File[], categoryId?: number): Promise<ITopic | null> {
    const listName = 'ForumTopics';
    const body = JSON.stringify({
      Title: topic.title,
      Body: topic.body,
      CategoryId: categoryId // Set the lookup ID for the category
    });

    try {
      const response = await this.context.spHttpClient.post(`${this.siteUrl}/_api/web/lists/getByTitle('${listName}')/items`, 
        SPHttpClient.configurations.v1, 
        {
          body: body
        }
      );
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to create topic: ${response.status} - ${errText}`);
      }

      const item = await response.json();

      // Handle file attachments
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const uploadResponse = await this.context.spHttpClient.post(
              `${this.siteUrl}/_api/web/lists/getByTitle('${listName}')/items(${item.Id})/AttachmentFiles/add(FileName='${file.name}')`,
              SPHttpClient.configurations.v1,
              {
                headers: {
                  'Content-type': 'application/octet-stream'
                },
                body: arrayBuffer
              }
            );
            if (!uploadResponse.ok) {
              const errText = await uploadResponse.text();
              console.error(`Failed to upload attachment ${file.name}: ${uploadResponse.status} - ${errText}`);
            }
          } catch (fileErr) {
            console.error(`Failed to upload attachment ${file.name}`, fileErr);
          }
        }
      }

      return {
        id: item.Id,
        title: item.Title || topic.title,
        url: `https://forum.cirruspilots.org/t/${item.Id}`,
        repliesCount: 0,
        viewsCount: 0,
        likesCount: 0,
        lastActivity: new Date(),
        category: topic.category,
        body: topic.body || item.Body, // Use the user's input immediately so it displays in the UI!
        posters: [{ id: this.context.pageContext.user.email, displayName: this.context.pageContext.user.displayName, email: this.context.pageContext.user.email }]
      };
    } catch (error) {
      console.error('Error creating topic', error);
      return null;
    }
  }

  public async createReply(topicId: number, replyBody: string): Promise<IReply | null> {
    const listName = 'ForumReplies';
    const body = JSON.stringify({
      Title: `Reply to ${topicId}`,
      Body: replyBody,
      TopicId: topicId, // SP formatting for lookup field
      LikesCount: 0
    });

    try {
      const response = await this.context.spHttpClient.post(`${this.siteUrl}/_api/web/lists/getByTitle('${listName}')/items`, 
        SPHttpClient.configurations.v1, 
        {
          body: body
        }
      );
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to create reply: ${response.status} - ${errText}`);
      }

      const item = await response.json();
      
      // Also update the topic's reply count and last activity
      await this._incrementTopicRepliesAndActivity(topicId);

      return {
        id: item.Id,
        title: item.Title,
        topicId: topicId,
        body: item.Body,
        authorName: this.context.pageContext.user.displayName,
        authorEmail: this.context.pageContext.user.email,
        createdDate: new Date(),
        likesCount: 0
      };
    } catch (error) {
      console.error('Error creating reply', error);
      return null;
    }
  }

  private async _incrementTopicRepliesAndActivity(topicId: number): Promise<void> {
    // In a production app, you might want to use a more robust way to increment, but this is a simple update
    try {
      // First get current count
      const getResponse = await this.context.spHttpClient.get(`${this.siteUrl}/_api/web/lists/getByTitle('ForumTopics')/items(${topicId})?$select=RepliesCount`, SPHttpClient.configurations.v1);
      const data = await getResponse.json();
      const currentCount = data.RepliesCount || 0;

      const body = JSON.stringify({
        RepliesCount: currentCount + 1
      });

      const postResponse = await this.context.spHttpClient.post(`${this.siteUrl}/_api/web/lists/getByTitle('ForumTopics')/items(${topicId})`, 
        SPHttpClient.configurations.v1, 
        {
          headers: {
            'X-HTTP-Method': 'MERGE',
            'IF-MATCH': '*'
          },
          body: body
        }
      );
      
      if (!postResponse.ok) {
        const errText = await postResponse.text();
        console.error(`Failed to update topic replies count: ${postResponse.status} - ${errText}`);
      }
    } catch (error) {
      console.error('Failed to update topic replies count', error);
    }
  }

  public async likeTopic(topicId: number): Promise<void> {
    
    try {
      const getResponse = await this.context.spHttpClient.get(`${this.siteUrl}/_api/web/lists/getByTitle('ForumTopics')/items(${topicId})?$select=LikesCount`, SPHttpClient.configurations.v1);
      const data = await getResponse.json();
      const currentCount = data.LikesCount || 0;

      const body = JSON.stringify({
        LikesCount: currentCount + 1
      });

      const postResponse = await this.context.spHttpClient.post(`${this.siteUrl}/_api/web/lists/getByTitle('ForumTopics')/items(${topicId})`, 
        SPHttpClient.configurations.v1, 
        {
          headers: {
            'X-HTTP-Method': 'MERGE',
            'IF-MATCH': '*'
          },
          body: body
        }
      );

      if (!postResponse.ok) {
        const errText = await postResponse.text();
        console.error(`Failed to like topic: ${postResponse.status} - ${errText}`);
      }
    } catch (error) {
      console.error('Failed to like topic', error);
    }
  }

  public async likeReply(replyId: number): Promise<void> {
    
    try {
      const getResponse = await this.context.spHttpClient.get(`${this.siteUrl}/_api/web/lists/getByTitle('ForumReplies')/items(${replyId})?$select=LikesCount`, SPHttpClient.configurations.v1);
      const data = await getResponse.json();
      const currentCount = data.LikesCount || 0;

      const body = JSON.stringify({
        LikesCount: currentCount + 1
      });

      const postResponse = await this.context.spHttpClient.post(`${this.siteUrl}/_api/web/lists/getByTitle('ForumReplies')/items(${replyId})`, 
        SPHttpClient.configurations.v1, 
        {
          headers: {
            'X-HTTP-Method': 'MERGE',
            'IF-MATCH': '*'
          },
          body: body
        }
      );

      if (!postResponse.ok) {
        const errText = await postResponse.text();
        console.error(`Failed to like reply: ${postResponse.status} - ${errText}`);
      }
    } catch (error) {
      console.error('Failed to like reply', error);
    }
  }
}
