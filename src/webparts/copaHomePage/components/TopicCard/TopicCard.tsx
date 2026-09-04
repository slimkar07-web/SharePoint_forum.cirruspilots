import * as React from 'react';
import { useState } from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import DOMPurify from 'dompurify';
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

  const handleLike = async () => {
    if (isLiked) return; 
    
    setIsLiked(true);
    setLikesCount(prev => prev + 1);
    try {
      await forumService.likeTopic(topic.id);
    } catch (error) {
      setIsLiked(false);
      setLikesCount(prev => prev - 1);
      alert("Failed to like topic: " + (error as Error).message);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + window.location.pathname + `?topicId=${topic.id}`);
      alert("Link copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const toggleReplies = async () => {
    const willShow = !showReplies;
    setShowReplies(willShow);
    
    if (willShow) {
      // Increment views count when opening topic
      void forumService.incrementTopicViews(topic.id);
      
      if (replies.length === 0) {
        const loadedReplies = await forumService.getReplies(topic.id);
        setReplies(loadedReplies);
      }
    }
  };

  const handleReplySubmit = async () => {
    if (!newReplyBody.trim()) return;
    setIsSubmittingReply(true);
    
    try {
      const newReply = await forumService.createReply(topic.id, newReplyBody);
      if (newReply) {
        setReplies(prev => [...prev, newReply]);
        setRepliesCount(prev => prev + 1);
        setNewReplyBody('');
      }
    } catch (error) {
      alert("Failed to post reply:\n\n" + (error as Error).message);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleAcceptAnswer = async (replyId: number) => {
    try {
      await forumService.acceptReply(replyId, topic.id);
      setReplies(prev => prev.map(r => r.id === replyId ? { ...r, isAcceptedAnswer: true } : { ...r, isAcceptedAnswer: false }));
    } catch (error) {
      alert("Failed to accept answer: " + (error as Error).message);
    }
  };

  const handleReplyLike = async (replyId: number, currentLikedState: boolean) => {
    if (currentLikedState) return;
    try {
      setReplies(prev => prev.map(r => r.id === replyId ? { ...r, currentUserLiked: true, likesCount: (r.likesCount || 0) + 1 } : r));
      await forumService.likeReply(replyId);
    } catch (error) {
      console.error(error);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const primaryPoster = topic.posters && topic.posters.length > 0 ? topic.posters[0] : null;
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Safely sanitize HTML
  const safeBodyHTML = DOMPurify.sanitize(topic.body || topic.excerpt || 'No content provided.');

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
          dangerouslySetInnerHTML={{ __html: safeBodyHTML }} 
        />
        {topic.attachments && topic.attachments.length > 0 && (
          <div style={{ marginTop: '15px', borderTop: '1px solid #edebe9', paddingTop: '10px' }}>
            <strong style={{ fontSize: '12px', color: '#605e5c' }}>Attachments:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
              {topic.attachments.map((att, idx) => (
                <a key={idx} href={att.serverRelativeUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: '#f3f2f1', borderRadius: '4px', textDecoration: 'none', color: '#0078d4', fontSize: '13px' }}>
                  <Icon iconName={att.fileName.match(/\.(jpeg|jpg|gif|png)$/i) ? "Photo2" : "Page"} />
                  {att.fileName}
                </a>
              ))}
            </div>
          </div>
        )}
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
        <button className={styles.actionButton} onClick={handleShare}>
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
                onKeyDown={(e) => e.key === 'Enter' && void handleReplySubmit()}
              />
              <button 
                className={styles.replySubmitBtn} 
                onClick={() => void handleReplySubmit()}
                disabled={!newReplyBody.trim() || isSubmittingReply}
              >
                <Icon iconName="Send" />
              </button>
            </div>
          </div>

          {replies.length > 0 && (
            <div className={styles.repliesList}>
              {replies.map(reply => (
                <div key={reply.id} className={styles.replyItem} style={{ border: reply.isAcceptedAnswer ? '2px solid #107c10' : 'none', padding: reply.isAcceptedAnswer ? '10px' : '0', borderRadius: '4px', marginBottom: '10px' }}>
                  <img 
                    src={`https://ui-avatars.com/api/?name=${reply.authorName || 'User'}&background=random`} 
                    alt="Reply Avatar" 
                    className={styles.replyAvatar} 
                  />
                  <div className={styles.replyContent}>
                    <div className={styles.replyHeader}>
                      <span className={styles.replyAuthor}>{reply.authorName}</span>
                      <span className={styles.replyDate}>{formatDate(reply.createdDate)}</span>
                      {reply.isAcceptedAnswer && (
                        <span style={{ color: '#107c10', fontWeight: 600, fontSize: '12px', marginLeft: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Icon iconName="CompletedSolid" /> Accepted Answer
                        </span>
                      )}
                    </div>
                    <div className={styles.replyBody} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.body) }} />
                    <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: reply.currentUserLiked ? '#0078d4' : '#605e5c', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: 0 }}
                        onClick={() => void handleReplyLike(reply.id, !!reply.currentUserLiked)}
                      >
                        <Icon iconName={reply.currentUserLiked ? "LikeSolid" : "Like"} /> {reply.likesCount || 'Like'}
                      </button>
                      
                      {/* Only topic author should accept answer in reality, but allowing it here for demo purposes */}
                      {!reply.isAcceptedAnswer && (
                        <button 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#605e5c', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: 0 }}
                          onClick={() => void handleAcceptAnswer(reply.id)}
                        >
                          <Icon iconName="SkypeCircleCheck" /> Accept Answer
                        </button>
                      )}
                    </div>
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
