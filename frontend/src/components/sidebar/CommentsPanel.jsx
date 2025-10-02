import React, { useState } from 'react';
import { useEditor } from '../../contexts/EditorContext';

const CommentsPanel = () => {
  const { 
    comments,
    setComments,
    currentProjectId,
    apiService 
  } = useEditor();
  
  const [newComment, setNewComment] = useState('');

  const addComment = async () => {
    if (!newComment.trim()) return;

    const timestamp = new Date().toLocaleString();
    const comment = {
      id: Date.now(),
      text: newComment.trim(),
      timestamp
    };

    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    setNewComment('');

    // Save to backend
    if (currentProjectId) {
      try {
        await apiService.updateAppState(currentProjectId, {
          comments: updatedComments
        });
        console.log('✅ Comments saved to backend');
      } catch (error) {
        console.error('❌ Failed to save comments:', error);
        // Could revert comment on error if needed
      }
    }
  };

  const deleteComment = async (commentId) => {
    const updatedComments = comments.filter(c => c.id !== commentId);
    setComments(updatedComments);

    // Save to backend
    if (currentProjectId) {
      try {
        await apiService.updateAppState(currentProjectId, {
          comments: updatedComments
        });
        console.log('✅ Comment deletion saved to backend');
      } catch (error) {
        console.error('❌ Failed to save comment deletion:', error);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      addComment();
    }
  };

  return (
    <div className="mb-3">
      <h6 className="fw-bold mb-2">
        <i className="bi bi-chat-dots me-2"></i>
        Comments ({comments.length})
      </h6>
      
      {/* Add Comment */}
      <div className="mb-3">
        <div className="input-group">
          <textarea
            className="form-control"
            placeholder="Add a comment... (Ctrl+Enter to save)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={2}
          />
          <button
            className="btn btn-outline-primary"
            type="button"
            onClick={addComment}
            disabled={!newComment.trim()}
          >
            <i className="bi bi-plus-lg"></i>
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="comments-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {comments.length === 0 ? (
          <div className="text-muted text-center py-3 small">
            <i className="bi bi-chat-square-dots me-2"></i>
            No comments yet. Add one above to get started.
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="card mb-2 border-light">
              <div className="card-body p-2">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <p className="mb-1 small">{comment.text}</p>
                    <small className="text-muted">
                      <i className="bi bi-clock me-1"></i>
                      {comment.timestamp}
                    </small>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-danger ms-2"
                    onClick={() => deleteComment(comment.id)}
                    title="Delete comment"
                  >
                    <i className="bi bi-trash3"></i>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comments Info */}
      {comments.length > 5 && (
        <div className="mt-2 text-muted small">
          <i className="bi bi-info-circle me-1"></i>
          Scroll to see older comments
        </div>
      )}
    </div>
  );
};

export default CommentsPanel;
