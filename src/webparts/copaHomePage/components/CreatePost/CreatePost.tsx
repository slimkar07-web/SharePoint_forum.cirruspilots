import * as React from 'react';
import { useState } from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import styles from './CreatePost.module.scss';
import { ICategory } from '../../../../models/ICategory';

export interface ICreatePostProps {
  categories: ICategory[];
  onCreatePost: (title: string, body: string, categoryId: number, files: File[]) => Promise<void>;
  currentUserDisplayName: string;
}

export const CreatePost: React.FunctionComponent<ICreatePostProps> = (props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number>(
    props.categories.length > 0 ? props.categories[0].id : 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim() || !selectedCategory) return;
    
    setIsSubmitting(true);
    try {
      await props.onCreatePost(title, body, selectedCategory, attachedFiles);
      
      // Reset form
      setTitle('');
      setBody('');
      setAttachedFiles([]);
      setIsExpanded(false);
    } catch (error) {
      alert("Failed to post topic:\n\n" + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.createPostContainer}>
      <div className={styles.postHeader} onClick={() => !isExpanded && setIsExpanded(true)} style={{ cursor: isExpanded ? 'default' : 'pointer' }}>
        <div className={styles.avatar}>
          {getInitials(props.currentUserDisplayName || 'User')}
        </div>
        {!isExpanded && (
          <div className={styles.headerText}>
            Share thoughts, ideas, or updates...
          </div>
        )}
        {isExpanded && (
          <div className={styles.headerText}>
            Create a New Discussion
          </div>
        )}
      </div>

      {isExpanded && (
        <>
          <div className={styles.postInputArea}>
            <input 
              type="text" 
              className={styles.titleInput} 
              placeholder="Discussion Title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <textarea 
              className={styles.bodyInput} 
              placeholder="What are your thoughts?" 
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          
          {attachedFiles.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0 12px 12px' }}>
              {attachedFiles.map((f, i) => (
                <div key={i} style={{ 
                  backgroundColor: '#e1dfdd', 
                  color: '#323130',
                  border: '1px solid #c8c6c4',
                  padding: '4px 10px', 
                  borderRadius: '16px', 
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Icon iconName="Page" style={{ color: '#0078d4' }} /> {f.name}
                  <Icon iconName="Cancel" style={{ cursor: 'pointer', marginLeft: '4px', color: '#605e5c' }} onClick={() => removeFile(i)} />
                </div>
              ))}
            </div>
          )}

          <div className={styles.postActions}>
            <div className={styles.leftActions}>
              <input 
                type="file" 
                multiple 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
              <button className={styles.iconButton} title="Add Image" onClick={() => fileInputRef.current?.click()}>
                <Icon iconName="Photo2" />
              </button>
              <button className={styles.iconButton} title="Add Attachment" onClick={() => fileInputRef.current?.click()}>
                <Icon iconName="Attach" />
              </button>
              <select 
                className={styles.categorySelect} 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(Number(e.target.value))}
              >
                {props.categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.title}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={styles.iconButton} 
                onClick={() => {
                  setIsExpanded(false);
                  setTitle('');
                  setBody('');
                  setAttachedFiles([]);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                className={styles.postButton} 
                onClick={handleSubmit}
                disabled={!title.trim() || !body.trim() || isSubmitting}
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
