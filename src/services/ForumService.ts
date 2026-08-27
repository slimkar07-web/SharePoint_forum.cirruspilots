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

  private getMockCategories(): ICategory[] {
    return [
      { 
        id: 1, 
        title: 'Guest Discussion', 
        colorHex: '#00a3cc', 
        iconName: 'Message',
        description: 'This category is for non-members of COPA to ask questions of COPA and interact with the COPA community prior to becoming a fully paid member.'
      },
      { 
        id: 2, 
        title: 'COPA Migrations', 
        colorHex: '#e22c2c', 
        iconName: 'Airplane',
        description: 'This Category is for COPA Annual Migration Announcements/Questions/Suggestions.'
      },
      { 
        id: 3, 
        title: 'Website Issues', 
        colorHex: '#999999', 
        iconName: 'Build',
        description: 'This category is available publicly to serve as a place to resolve access issues to the website. ALL posts in this section will auto-close after 3 days and are publicly visible.'
      },
      { 
        id: 4, 
        title: 'Public Announcements', 
        colorHex: '#0f9d58', 
        iconName: 'Megaphone',
        description: 'Important public announcements from the COPA organization.'
      }
    ];
  }

  private getMockTopics(categoryName: string): ITopic[] {
    const mockTopics = [
      {
        id: 1,
        title: 'Migration 2026 Volunteers Needed!',
        url: 'https://forum.cirruspilots.org/t/1',
        repliesCount: 6,
        viewsCount: 641,
        lastActivity: new Date(),
        category: 'COPA Migrations',
        isLocked: false,
        isPinned: true,
        tags: ['Volunteers', '2026'],
        posters: [{ id: '1', displayName: 'John Doe', email: 'john@example.com' }]
      },
      {
        id: 2,
        title: 'Can I attend without a plane?',
        url: 'https://forum.cirruspilots.org/t/2',
        repliesCount: 42,
        viewsCount: 1205,
        lastActivity: new Date(Date.now() - 86400000),
        category: 'Guest Discussion',
        isLocked: false,
        isPinned: false,
        tags: ['Questions'],
        posters: [{ id: '2', displayName: 'Jane Smith', email: 'jane@example.com' }]
      },
      {
        id: 3,
        title: 'Login issues on the new portal',
        url: 'https://forum.cirruspilots.org/t/3',
        repliesCount: 8,
        viewsCount: 150,
        lastActivity: new Date(Date.now() - 172800000),
        category: 'Website Issues',
        isLocked: false,
        isPinned: false,
        tags: ['Login', 'Portal'],
        posters: [{ id: '3', displayName: 'Mike Johnson', email: 'mike@example.com' }]
      }
    ];

    if (categoryName && categoryName !== 'All Categories') {
      return mockTopics.filter(t => t.category === categoryName);
    }
    return mockTopics;
  }

  private getMockReplies(topicId: number): IReply[] {
    return [
      {
        id: 1,
        title: 'Reply 1',
        topicId: topicId,
        body: '<p>This is a mock reply to the topic.</p>',
        authorName: 'John Doe',
        authorEmail: 'john@example.com',
        createdDate: new Date()
      },
      {
        id: 2,
        title: 'Reply 2',
        topicId: topicId,
        body: '<p>Another mock reply.</p>',
        authorName: 'Jane Smith',
        authorEmail: 'jane@example.com',
        createdDate: new Date(Date.now() - 3600000)
      }
    ];
  }

  public async getCategories(): Promise<ICategory[]> {
    if (Environment.type === EnvironmentType.Local || Environment.type === EnvironmentType.Test) {
      return this.getMockCategories();
    }

    const listName = 'ForumCategories';
    const query = `${this.siteUrl}/_api/web/lists/getByTitle('${listName}')/items?$select=Id,Title,Description,ColorHex,IconName`;

    try {
      const response: SPHttpClientResponse = await this.context.spHttpClient.get(query, SPHttpClient.configurations.v1);
      const data = await response.json();

      if (!data.value || data.value.length === 0) {
        return this.getMockCategories(); // Fallback to mock if list is empty
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
      return this.getMockCategories(); // Fallback to mock on error
    }
  }

  public async getTopics(categoryName: string): Promise<ITopic[]> {
    if (Environment.type === EnvironmentType.Local || Environment.type === EnvironmentType.Test) {
      return this.getMockTopics(categoryName);
    }

    const listName = 'ForumTopics'; 
    let filterQuery = '';
    if (categoryName && categoryName !== 'All Categories') {
      filterQuery = `&$filter=Category/Title eq '${categoryName}'`;
    }

    const query = `${this.siteUrl}/_api/web/lists/getByTitle('${listName}')/items?$select=Id,Title,RepliesCount,ViewsCount,LastActivity,Category/Title,IsLocked,IsPinned,Tags,Author/EMail,Author/Title&$expand=Author,Category${filterQuery}&$orderby=LastActivity desc`;

    try {
      const response: SPHttpClientResponse = await this.context.spHttpClient.get(query, SPHttpClient.configurations.v1);
      const data = await response.json();

      if (!data.value || data.value.length === 0) {
        return this.getMockTopics(categoryName); // Fallback to mock if list is empty
      }

      return data.value.map((item: any) => ({
        id: item.Id,
        title: item.Title,
        url: `https://forum.cirruspilots.org/t/${item.Id}`,
        repliesCount: item.RepliesCount || 0,
        viewsCount: item.ViewsCount || 0,
        lastActivity: new Date(item.LastActivity || new Date()),
        category: item.Category?.Title,
        isLocked: !!item.IsLocked,
        isPinned: !!item.IsPinned,
        tags: item.Tags ? item.Tags.split(',').map((t: string) => t.trim()) : [],
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
      return this.getMockTopics(categoryName); // Fallback to mock on error
    }
  }

  public async getReplies(topicId: number): Promise<IReply[]> {
    if (Environment.type === EnvironmentType.Local || Environment.type === EnvironmentType.Test) {
      return this.getMockReplies(topicId);
    }

    const listName = 'ForumReplies'; 
    const query = `${this.siteUrl}/_api/web/lists/getByTitle('${listName}')/items?$select=Id,Title,Body,IsAcceptedAnswer,Author/EMail,Author/Title,Created&$expand=Author&$filter=TopicId eq ${topicId}&$orderby=Created asc`;

    try {
      const response: SPHttpClientResponse = await this.context.spHttpClient.get(query, SPHttpClient.configurations.v1);
      const data = await response.json();

      if (!data.value || data.value.length === 0) {
        return this.getMockReplies(topicId);
      }

      return data.value.map((item: any) => ({
        id: item.Id,
        title: item.Title,
        topicId: topicId,
        body: item.Body,
        isAcceptedAnswer: !!item.IsAcceptedAnswer,
        authorName: item.Author?.Title || 'Unknown User',
        authorEmail: item.Author?.EMail,
        createdDate: new Date(item.Created)
      }));
    } catch (error) {
      console.error('Error fetching replies from SharePoint list', error);
      return this.getMockReplies(topicId);
    }
  }
}
