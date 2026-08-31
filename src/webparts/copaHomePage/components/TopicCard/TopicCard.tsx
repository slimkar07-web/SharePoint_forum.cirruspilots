import * as React from 'react';
import { useState, useEffect } from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import styles from './TopicCard.module.scss';
import { ITopic } from '../../../../models/ITopic';
import { IReply } from '../../../../models/IReply';
import { ForumService } from '../../../../services/ForumService';

export interface ITopicCardProps {
  topic: ITopic;
  forumService: ForumService;
  currentUserDisplayName: string;
}

export const TopicCard: React.FunctionComponent<ITopicCardProps> = (props) => {
  const { topic, forumService, currentUserDisplayName } = props;
  const [isLiked, setIsLiked] = useState(topic.currentUserLiked || false);
  const [likesCount, setLikesCount] = useState(topic.likesCount || 0);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<IReply[]>([]);
  const [newReplyBody, setNewReplyBody] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [repliesCount, setRepliesCount] = useState(topic.repliesCount || 0);

  // Parse HTML string to plain text for excerpt if needed, or render safely
  // We'll render dangerouslySetInnerHTML for simplicity in this demo, but typically you'd sanitize

  const handleLike = async () => {
    if (isLiked) return; // Prevent multiple likes for demo
    
    setIsLiked(true);
    setLikesCount(prev => prev + 1);
    await forumService.likeTopic(topic.id);
  };

  const toggleReplies = async () => {
    const willShow = !showReplies;
    setShowReplies(willShow);
    
    if (willShow && replies.length === 0) {
      // Load replies
      const loadedReplies = await forumService.getReplies(topic.id);
      setReplies(loadedReplies);
    }
  };

  const handleReplySubmit = async () => {
    if (!newReplyBody.trim()) return;
    setIsSubmittingReply(true);
    
    const newReply = await forumService.createReply(topic.id, newReplyBody);
    if (newReply) {
      setReplies(prev => [...prev, newReply]);
      setRepliesCount(prev => prev + 1);
      setNewReplyBody('');
    }
    setIsSubmittingReply(false);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      if (diffHours === 0) return 'Just now';
      return `${diffHours}h ago`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const primaryPoster = topic.posters && topic.posters.length > 0 ? topic.posters[0] : null;
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className={styles.topicCardContainer}>
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <img 
            src={primaryPoster?.avatarUrl || `https://ui-avatars.com/api/?name=${primaryPoster?.displayName || 'Unknown'}&background=random`} 
            alt="Avatar" 
            className={styles.authorAvatar} 
          />
          <div className={styles.headerInfo}>
            <span className={styles.authorName}>{primaryPoster?.displayName || 'Unknown Author'}</span>
            <div className={styles.metaInfo}>
              <span>{formatDate(topic.lastActivity)}</span>
              {topic.category && (
                <>
                  <span>•</span>
                  <span className={styles.categoryBadge}>
                    <span className={styles.categoryColor} style={{ backgroundColor: topic.categoryColor || '#0078d4' }} />
                    {topic.category}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.cardContent}>
        <a href={topic.url} className={styles.topicTitle} onClick={(e) => e.preventDefault()}>
          {topic.isPinned && <Icon iconName="Pinned" className={styles.iconPinned} />}
          {topic.isLocked && <Icon iconName="Lock" className={styles.iconLocked} />}
          {topic.title}
        </a>
        <div 
          className={styles.topicBody}
          dangerouslySetInnerHTML={{ __html: topic.body || topic.excerpt || 'No content provided.' }} 
        />
      </div>

      <div className={styles.cardActions}>
        <button className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`} onClick={handleLike}>
          <Icon iconName={isLiked ? "LikeSolid" : "Like"} className={styles.icon} />
          {likesCount > 0 ? likesCount : 'Like'}
        </button>
        <button className={styles.actionButton} onClick={toggleReplies}>
          <Icon iconName="Comment" className={styles.icon} />
          {repliesCount > 0 ? repliesCount : 'Comment'}
        </button>
        <button className={styles.actionButton}>
          <Icon iconName="Share" className={styles.icon} />
          Share
        </button>
      </div>

      {showReplies && (
        <div className={styles.repliesSection}>
          <div className={styles.replyInputArea}>
            <div className={styles.replyAvatar}>
              {getInitials(currentUserDisplayName || 'User')}
            </div>
            <div className={styles.replyInputWrapper}>
              <input 
                type="text" 
                className={styles.replyInput} 
                placeholder="Write a comment..." 
                value={newReplyBody}
                onChange={(e) => setNewReplyBody(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit()}
              />
              <button 
                className={styles.replySubmitBtn} 
                onClick={handleReplySubmit}
                disabled={!newReplyBody.trim() || isSubmittingReply}
              >
                <Icon iconName="Send" />
              </button>
            </div>
          </div>

          {replies.length > 0 && (
            <div className={styles.repliesList}>
              {replies.map(reply => (
                <div key={reply.id} className={styles.replyItem}>
                  <img 
                    src={`https://ui-avatars.com/api/?name=${reply.authorName || 'User'}&background=random`} 
                    alt="Reply Avatar" 
                    className={styles.replyAvatar} 
                  />
                  <div className={styles.replyContent}>
                    <div className={styles.replyHeader}>
                      <span className={styles.replyAuthor}>{reply.authorName}</span>
                      <span className={styles.replyDate}>{formatDate(reply.createdDate)}</span>
                    </div>
                    <div className={styles.replyBody} dangerouslySetInnerHTML={{ __html: reply.body }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
