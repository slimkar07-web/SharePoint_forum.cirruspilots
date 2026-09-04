export interface IPoster {
  id: string;
  displayName: string;
  avatarUrl?: string;
  email?: string;
}

export interface ITopic {
  id: number;
  title: string;
  url: string;
  posters: IPoster[];
  repliesCount: number;
  viewsCount: number;
  lastActivity: Date;
  category?: string;
  categoryColor?: string;
  isLocked?: boolean;
  isPinned?: boolean;
  excerpt?: string;
  tags?: string[];
  body?: string;
  likesCount?: number;
  currentUserLiked?: boolean;
  attachments?: { fileName: string; serverRelativeUrl: string }[];
}
