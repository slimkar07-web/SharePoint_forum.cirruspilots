import * as React from 'react';
import styles from './TopicList.module.scss';
import { ITopic } from '../../../../models/ITopic';
import { TopicCard } from '../TopicCard/TopicCard';
import { ForumService } from '../../../../services/ForumService';

export interface ITopicListProps {
  topics: ITopic[];
  forumService: ForumService;
  currentUserDisplayName: string;
  onSelectTopic?: (topic: ITopic) => void;
}

export const TopicList: React.FunctionComponent<ITopicListProps> = (props) => {
  return (
    <div className={styles.topicListContainer}>
      {props.topics.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#605e5c' }}>
          <img 
            src="https://img.freepik.com/free-vector/no-data-concept-illustration_114360-536.jpg" 
            alt="No topics" 
            style={{ width: '200px', display: 'block', margin: '0 auto 20px', borderRadius: '50%' }}
          />
          <h3>You're all caught up here!</h3>
          <p>No topics found for this category. Be the first to start a discussion!</p>
        </div>
      ) : (
        props.topics.map(topic => (
          <TopicCard 
            key={topic.id} 
            topic={topic} 
            forumService={props.forumService} 
            currentUserDisplayName={props.currentUserDisplayName}
            onSelectTopic={props.onSelectTopic}
          />
        ))
      )}
    </div>
  );
};
