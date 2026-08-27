import * as React from 'react';
import styles from './TopicList.module.scss';
import { ITopic } from '../../../../models/ITopic';
import { Icon } from '@fluentui/react/lib/Icon';

export interface ITopicListProps {
  topics: ITopic[];
}

export const TopicList: React.FunctionComponent<ITopicListProps> = (props) => {
  const formatViews = (views: number) => {
    if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'k';
    }
    return views.toString();
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays < 30) {
      return diffDays + 'd';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={styles.topicListContainer}>
      <div className={styles.listHeader}>
        <div className={styles.colTopic}>Topic</div>
        <div className={styles.colPosters} />
        <div className={styles.colReplies}>Replies</div>
        <div className={styles.colViews}>Views</div>
        <div className={styles.colActivity}>Activity</div>
      </div>
      
      <div className={styles.listBody}>
        {props.topics.map(topic => (
          <div key={topic.id} className={styles.topicRow}>
            <div className={styles.colTopic}>
              <div className={styles.topicTitleRow}>
                {topic.isPinned && <Icon iconName="Pinned" className={styles.iconPinned} />}
                {topic.isLocked && <Icon iconName="Lock" className={styles.iconLocked} />}
                <a href={topic.url} className={styles.topicTitle}>{topic.title}</a>
              </div>
              
              <div className={styles.topicMeta}>
                {topic.category && (
                  <span className={styles.categoryBadge}>
                    <span className={styles.categoryColor} style={{ backgroundColor: topic.categoryColor || '#ccc' }} />
                    {topic.category}
                  </span>
                )}
                {topic.tags && topic.tags.map(tag => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>

              {topic.excerpt && (
                <div className={styles.topicExcerpt}>
                  {topic.excerpt}
                </div>
              )}
            </div>

            <div className={styles.colPosters}>
              {topic.posters.map((poster, idx) => (
                <img 
                  key={poster.id} 
                  src={poster.avatarUrl || 'https://ui-avatars.com/api/?name=' + poster.displayName} 
                  alt={poster.displayName} 
                  className={styles.posterAvatar} 
                  style={{ zIndex: topic.posters.length - idx }}
                />
              ))}
            </div>

            <div className={styles.colReplies}>
              <span className={styles.statValue}>{topic.repliesCount}</span>
            </div>

            <div className={styles.colViews}>
              <span className={`${styles.statValue} ${topic.viewsCount >= 1000 ? styles.hotStat : ''}`}>
                {formatViews(topic.viewsCount)}
              </span>
            </div>

            <div className={styles.colActivity}>
              <span className={styles.activityValue}>{formatDate(topic.lastActivity)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
