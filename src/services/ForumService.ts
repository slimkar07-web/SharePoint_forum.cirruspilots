import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
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
        return [];
      }

      return data.value.map((item: any) => ({
        id: item.Id,
        title: item.Title,
        description: item.Description,
        colorHex: item.ColorHex || '#0078d4',
        iconName: item.IconName
      }));
    } catch (error) {
      console.error('Error fetching categories from SharePoint list', error);
      return [];
    }
  }

  public async getTopics(categoryName: string): Promise<ITopic[]> {
    const listName = 'ForumTopics'; 
    let filterQuery = '';
    if (categoryName && categoryName !== 'All Categories') {
      filterQuery = `&$filter=Category/Title eq '${categoryName}'`;
    }

    const query = `${this.siteUrl}/_api/web/lists/getByTitle('${listName}')/items?$select=Id,Title,Body,Modified,Category/Title,Category/ColorHex,Author/EMail,Author/Title,ViewsCount,RepliesCount,AttachmentFiles&$expand=Author,Category,AttachmentFiles${filterQuery}&$orderby=Modified desc`;

    try {
      // Fetch topics
      const response: SPHttpClientResponse = await this.context.spHttpClient.get(query, SPHttpClient.configurations.v1);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch topics: ${response.status} - ${errText}`);
      }
      const data = await response.json();
      if (!data.value || data.value.length === 0) return [];

      // Fetch all topic likes to compute counts and user status
      let allTopicLikes: any[] = [];
      try {
        const likesQuery = `${this.siteUrl}/_api/web/lists/getByTitle('ForumTopicLikes')/items?$select=TopicId,UserEmail`;
        const likesRes = await this.context.spHttpClient.get(likesQuery, SPHttpClient.configurations.v1);
        const likesData = await likesRes.json();
        if (likesData.value) {
          allTopicLikes = likesData.value;
        }
      } catch (e) {
        console.error('Failed to fetch user likes', e);
      }

      return data.value.map((item: any) => {
        const topicLikes = allTopicLikes.filter(l => l.TopicId === item.Id);
        const currentUserLiked = topicLikes.some(l => l.UserEmail === this.context.pageContext.user.email);
        
        return {
          id: item.Id,
          title: item.Title,
          url: `https://forum.cirruspilots.org/t/${item.Id}`,
          repliesCount: item.RepliesCount || 0,
          viewsCount: item.ViewsCount || 0,
          lastActivity: new Date(item.Modified || new Date()),
          category: item.Category?.Title,
          categoryColor: item.Category?.ColorHex || '#0078d4',
          isLocked: false,
          isPinned: false,
          body: item.Body,
          likesCount: topicLikes.length,
          currentUserLiked: currentUserLiked,
          attachments: item.AttachmentFiles?.map((f: any) => ({ fileName: f.FileName, serverRelativeUrl: f.ServerRelativeUrl })) || [],
          tags: [],
          posters: [
            {
              id: item.Author?.EMail || item.Id.toString(),
              displayName: item.Author?.Title || 'Unknown User',
              email: item.Author?.EMail
            }
          ]
        };
      });
    } catch (error) {
      console.error('Error fetching topics from SharePoint list', error);
      return [];
    }
  }

  public async getReplies(topicId: number): Promise<IReply[]> {
    const listName = 'ForumReplies'; 
    const query = `${this.siteUrl}/_api/web/lists/getByTitle('${listName}')/items?$select=Id,Title,Body,IsAcceptedAnswer,Author/EMail,Author/Title,Created,TopicId/Id&$expand=Author,TopicId&$filter=TopicId/Id eq ${topicId}&$orderby=Created asc`;

    try {
      const fieldsRes = await this.context.spHttpClient.get(`${this.siteUrl}/_api/web/lists/getByTitle('${listName}')/fields?$filter=TypeAsString eq 'Lookup'`, SPHttpClient.configurations.v1);
      const fieldsData = await fieldsRes.json();
      const lookupFields = fieldsData.value ? fieldsData.value.map((f: any) => f.InternalName) : [];
      
      const response: SPHttpClientResponse = await this.context.spHttpClient.get(query, SPHttpClient.configurations.v1);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch replies: ${response.status} - ${errText}. Lookup fields in list: ${lookupFields.join(', ')}`);
      }
      const data = await response.json();
      if (!data.value || data.value.length === 0) return [];

      let allReplyLikes: any[] = [];
      try {
        const likesQuery = `${this.siteUrl}/_api/web/lists/getByTitle('ForumReplyLikes')/items?$select=ReplyId,UserEmail`;
        const likesRes = await this.context.spHttpClient.get(likesQuery, SPHttpClient.configurations.v1);
        const likesData = await likesRes.json();
        if (likesData.value) {
          allReplyLikes = likesData.value;
        }
      } catch (e) {
        console.error('Failed to fetch reply likes', e);
      }

      return data.value.map((item: any) => {
        const replyLikes = allReplyLikes.filter(l => l.ReplyId === item.Id);
        const currentUserLiked = replyLikes.some(l => l.UserEmail === this.context.pageContext.user.email);
        
        return {
          id: item.Id,
          title: item.Title,
          topicId: topicId,
          body: item.Body,
          isAcceptedAnswer: !!item.IsAcceptedAnswer,
          authorName: item.Author?.Title || 'Unknown User',
          authorEmail: item.Author?.EMail,
          createdDate: new Date(item.Created),
          likesCount: replyLikes.length,
          currentUserLiked: currentUserLiked
        };
      });
    } catch (error) {
      console.error('Error fetching replies from SharePoint list', error);
      return [];
    }
  }

  public async createTopic(topic: Partial<ITopic>, files?: File[], categoryId?: number): Promise<ITopic | undefined> {
    const listName = 'ForumTopics';
    const body = JSON.stringify({
      Title: topic.title,
      Body: topic.body,
      CategoryId: categoryId,
      ViewsCount: 0,
      RepliesCount: 0
    });

    try {
      const response = await this.context.spHttpClient.post(`${this.siteUrl}/_api/web/lists/getByTitle('${listName}')/items`, 
        SPHttpClient.configurations.v1, 
        { body: body }
      );
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to create topic: ${response.status} - ${errText}`);
      }

      const item = await response.json();
      const attachments = [];

      // Handle file attachments
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const uploadResponse = await this.context.spHttpClient.post(
              `${this.siteUrl}/_api/web/lists/getByTitle('${listName}')/items(${item.Id})/AttachmentFiles/add(FileName='${file.name}')`,
              SPHttpClient.configurations.v1,
              {
                headers: { 'Content-type': 'application/octet-stream' },
                body: arrayBuffer
              }
            );
            if (!uploadResponse.ok) {
              const errText = await uploadResponse.text();
              throw new Error(errText);
            }
            const uploadedFile = await uploadResponse.json();
            attachments.push({ fileName: uploadedFile.FileName, serverRelativeUrl: uploadedFile.ServerRelativeUrl });
          } catch (fileErr) {
            console.error(`Failed to upload attachment ${file.name}`, fileErr);
            throw new Error(`Topic created, but failed to upload attachment ${file.name}: ${(fileErr as Error).message}`);
          }
        }
      }

      return {
        id: item.Id,
        title: item.Title || topic.title || '',
        url: `https://forum.cirruspilots.org/t/${item.Id}`,
        repliesCount: 0,
        viewsCount: 0,
        likesCount: 0,
        lastActivity: new Date(),
        category: topic.category,
        body: topic.body || item.Body,
        attachments: attachments,
        posters: [{ id: this.context.pageContext.user.email, displayName: this.context.pageContext.user.displayName, email: this.context.pageContext.user.email }]
      };
    } catch (error) {
      console.error('Error creating topic', error);
      throw error;
    }
  }

  public async createReply(topicId: number, replyBody: string): Promise<IReply | undefined> {
    const listName = 'ForumReplies';
    const body = JSON.stringify({
      Title: `Reply to ${topicId}`,
      Body: replyBody,
      TopicIdId: Number(topicId)
    });

    try {
      const response = await this.context.spHttpClient.post(`${this.siteUrl}/_api/web/lists/getByTitle('${listName}')/items`, 
        SPHttpClient.configurations.v1, 
        { body: body }
      );
      
      if (!response.ok) {
        const errText = await response.text();
        
        // Fetch fields for diagnostics
        const fieldsRes = await this.context.spHttpClient.get(`${this.siteUrl}/_api/web/lists/getByTitle('${listName}')/fields?$filter=TypeAsString eq 'Lookup'`, SPHttpClient.configurations.v1);
        const fieldsData = await fieldsRes.json();
        const lookupFields = fieldsData.value ? fieldsData.value.map((f: any) => f.InternalName) : [];

        throw new Error(`Failed to create reply: ${response.status} - ${errText}. Lookup fields in list: ${lookupFields.join(', ')}`);
      }

      const item = await response.json();
      
      await this._safeIncrement('ForumTopics', topicId, 'RepliesCount');

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
      throw error;
    }
  }

  public async acceptReply(replyId: number, topicId: number): Promise<void> {
    // Requires resolving any previous accepted answer first if there can only be one, 
    // but for now just mark this one as accepted.
    try {
      const response = await this.context.spHttpClient.post(`${this.siteUrl}/_api/web/lists/getByTitle('ForumReplies')/items(${replyId})`, 
        SPHttpClient.configurations.v1, 
        {
          headers: {
            'X-HTTP-Method': 'MERGE',
            'IF-MATCH': '*'
          },
          body: JSON.stringify({ IsAcceptedAnswer: true })
        }
      );
      if (!response.ok) throw new Error(await response.text());
    } catch (error) {
      console.error('Failed to accept reply', error);
      throw error;
    }
  }

  public async likeTopic(topicId: number): Promise<void> {
    try {
      // Check for duplicate
      const checkRes = await this.context.spHttpClient.get(`${this.siteUrl}/_api/web/lists/getByTitle('ForumTopicLikes')/items?$filter=TopicId eq ${topicId} and UserEmail eq '${this.context.pageContext.user.email}'`, SPHttpClient.configurations.v1);
      const checkData = await checkRes.json();
      if (checkData.value && checkData.value.length > 0) return;

      const postRes = await this.context.spHttpClient.post(`${this.siteUrl}/_api/web/lists/getByTitle('ForumTopicLikes')/items`, SPHttpClient.configurations.v1, {
        body: JSON.stringify({ 
          Title: `Like for topic ${topicId}`, 
          TopicId: topicId,
          UserEmail: this.context.pageContext.user.email
        })
      });
      if (!postRes.ok) throw new Error(await postRes.text());
    } catch (error) {
      console.error('Failed to like topic', error);
      throw error;
    }
  }

  public async likeReply(replyId: number): Promise<void> {
    try {
      const checkRes = await this.context.spHttpClient.get(`${this.siteUrl}/_api/web/lists/getByTitle('ForumReplyLikes')/items?$filter=ReplyId eq ${replyId} and UserEmail eq '${this.context.pageContext.user.email}'`, SPHttpClient.configurations.v1);
      const checkData = await checkRes.json();
      if (checkData.value && checkData.value.length > 0) return;

      const postRes = await this.context.spHttpClient.post(`${this.siteUrl}/_api/web/lists/getByTitle('ForumReplyLikes')/items`, SPHttpClient.configurations.v1, {
        body: JSON.stringify({ 
          Title: `Like for reply ${replyId}`, 
          ReplyId: replyId,
          UserEmail: this.context.pageContext.user.email
        })
      });
      if (!postRes.ok) throw new Error(await postRes.text());
    } catch (error) {
      console.error('Failed to like reply', error);
      throw error;
    }
  }

  public async incrementTopicViews(topicId: number): Promise<void> {
    await this._safeIncrement('ForumTopics', topicId, 'ViewsCount');
  }

  private async _safeIncrement(listName: string, itemId: number, fieldToIncrement: string): Promise<void> {
    let success = false;
    let attempts = 0;
    while (!success && attempts < 3) {
      try {
        attempts++;
        const getResponse = await this.context.spHttpClient.get(`${this.siteUrl}/_api/web/lists/getByTitle('${listName}')/items(${itemId})?$select=${fieldToIncrement}`, SPHttpClient.configurations.v1);
        const data = await getResponse.json();
        const currentCount = data[fieldToIncrement] || 0;
        const etag = data['odata.etag'];

        const postResponse = await this.context.spHttpClient.post(`${this.siteUrl}/_api/web/lists/getByTitle('${listName}')/items(${itemId})`, 
          SPHttpClient.configurations.v1, 
          {
            headers: {
              'X-HTTP-Method': 'MERGE',
              'IF-MATCH': etag || '*' // Fallback to * if ETag is somehow missing
            },
            body: JSON.stringify({ [fieldToIncrement]: currentCount + 1 })
          }
        );
        
        if (postResponse.ok) {
          success = true;
        } else if (postResponse.status !== 412) { // 412 Precondition Failed
          console.error(`Failed to increment ${fieldToIncrement}`, await postResponse.text());
          break;
        }
      } catch (e) {
        console.error('Error in safe increment', e);
        break;
      }
    }
  }
}
