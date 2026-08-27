import { ITopic } from '../../../../models/ITopic';

export const mockTopics: ITopic[] = [
  {
    id: 1,
    title: 'How to Upgrade/Update your COPA Membership',
    url: '#',
    posters: [
      { id: '1', displayName: 'Poster 1', avatarUrl: 'https://global.discourse-cdn.com/copa/original/1X/ba2b40705401c3dd99dcc1c927b73d561cb4d3cf.png' }
    ],
    repliesCount: 0,
    viewsCount: 12500,
    lastActivity: new Date('2020-05-15'),
    isPinned: true,
    isLocked: true,
    category: 'Website Issues',
    categoryColor: '#c5c5c5',
    excerpt: 'Here are the instructions for updating your COPA Membership. SomeUsers are just "Free" Guest Members with Very Limited access to the Forums. (Guest and Website issues) Other Members may have let their Membership Lapse ... read more'
  },
  {
    id: 2,
    title: 'COPA Forums | New User Guide',
    url: '#',
    posters: [
      { id: '1', displayName: 'Poster 1', avatarUrl: 'https://global.discourse-cdn.com/copa/original/1X/ba2b40705401c3dd99dcc1c927b73d561cb4d3cf.png' }
    ],
    repliesCount: 2,
    viewsCount: 19000,
    lastActivity: new Date('2020-04-10'),
    isPinned: true,
    isLocked: true,
    category: 'Website Issues',
    categoryColor: '#c5c5c5',
    excerpt: 'Welcome! As a new user of the COPA Forums, we hope you will find this site intuitive and clearly structured, but here is some guidance to get you started: Basic Terms Used by the COPA Forums (Nomenclature) Here are so... read more'
  },
  {
    id: 3,
    title: 'COPA Migration 2026 Registration Now Open!',
    url: '#',
    posters: [
      { id: '2', displayName: 'Ethan', avatarUrl: 'https://global.discourse-cdn.com/copa/original/1X/ba2b40705401c3dd99dcc1c927b73d561cb4d3cf.png' },
      { id: '3', displayName: 'Jason', avatarUrl: 'https://global.discourse-cdn.com/copa/original/1X/ba2b40705401c3dd99dcc1c927b73d561cb4d3cf.png' }
    ],
    repliesCount: 9,
    viewsCount: 1100,
    lastActivity: new Date('2026-08-20'),
    category: 'COPA Migrations',
    categoryColor: '#e03a3e'
  },
  {
    id: 4,
    title: 'Email Replies Newly Rejected',
    url: '#',
    posters: [
      { id: '4', displayName: 'Shane', avatarUrl: 'https://global.discourse-cdn.com/copa/original/1X/ba2b40705401c3dd99dcc1c927b73d561cb4d3cf.png' },
      { id: '5', displayName: 'Sanjay', avatarUrl: 'https://global.discourse-cdn.com/copa/original/1X/ba2b40705401c3dd99dcc1c927b73d561cb4d3cf.png' }
    ],
    repliesCount: 7,
    viewsCount: 252,
    lastActivity: new Date('2026-07-28'),
    isLocked: true,
    category: 'Website Issues',
    categoryColor: '#c5c5c5'
  },
  {
    id: 5,
    title: 'Persistent hot #4 on SR22 G5 NA, survived a cylinder replacement. Looking for the detail I\'m missing',
    url: '#',
    posters: [
      { id: '6', displayName: 'User', avatarUrl: 'https://global.discourse-cdn.com/copa/original/1X/ba2b40705401c3dd99dcc1c927b73d561cb4d3cf.png' }
    ],
    repliesCount: 3,
    viewsCount: 184,
    lastActivity: new Date('2026-07-25'),
    category: 'Guest Discussion',
    categoryColor: '#b3b3b3'
  }
];
