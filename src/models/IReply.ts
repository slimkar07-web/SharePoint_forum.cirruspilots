export interface IReply {
  id: number;
  title: string;
  topicId: number;
  body: string;
  isAcceptedAnswer?: boolean;
  authorEmail?: string;
  authorName?: string;
  createdDate: Date;
  likesCount?: number;
  currentUserLiked?: boolean;
}
