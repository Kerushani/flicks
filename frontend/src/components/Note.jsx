import React, { useState } from "react";
import "../style/Note.css"

function Note({ note, onDelete, onEdit, onReply, currentUser }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(note.content);
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [showReplies, setShowReplies] = useState(false);

    const isAuthor = currentUser && currentUser.id === note.author_id;

    const handleEdit = () => {
        onEdit(note.id, editedContent);
        setIsEditing(false);
    };

    const handleReply = () => {
        onReply(note.id, replyContent);
        setReplyContent("");
        setIsReplying(false);
        setShowReplies(true);
    };

    return (
        <div className="note-container">
            <div className="note-header">
                <div className="author-info">
                    <img 
                        src={note.author_avatar} 
                        alt={note.author_username} 
                        className="author-avatar"
                    />
                    <div className="author-details">
                        <p className="note-title">{note.title}</p>
                        <p className="note-author">Posted by {note.author_username}</p>
                    </div>
                </div>
                <span className="note-time">{note.time_ago}</span>
            </div>

            <div className="note-content">
                {isEditing ? (
                    <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="edit-textarea"
                    />
                ) : (
                    <p>{note.content}</p>
                )}
            </div>

            <div className="note-footer">
                <div className="note-actions">
                    {currentUser && (
                        <button 
                            className="action-button reply-button"
                            onClick={() => setIsReplying(!isReplying)}
                        >
                            Reply
                        </button>
                    )}
                    {isAuthor && (
                        <>
                            <button 
                                className="action-button edit-button"
                                onClick={() => isEditing ? handleEdit() : setIsEditing(true)}
                            >
                                {isEditing ? 'Save' : 'Edit'}
                            </button>
                            <button 
                                className="action-button delete-button"
                                onClick={() => onDelete(note.id)}
                            >
                                Delete
                            </button>
                        </>
                    )}
                </div>
                {note.edited && <span className="edited-tag">(edited)</span>}
                {note.reply_count > 0 && (
                    <button 
                        className="show-replies-button"
                        onClick={() => setShowReplies(!showReplies)}
                    >
                        {showReplies ? 'Hide' : 'Show'} {note.reply_count} {note.reply_count === 1 ? 'reply' : 'replies'}
                    </button>
                )}
            </div>

            {isReplying && (
                <div className="reply-form">
                    <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="reply-textarea"
                    />
                    <div className="reply-actions">
                        <button 
                            className="action-button cancel-button"
                            onClick={() => setIsReplying(false)}
                        >
                            Cancel
                        </button>
                        <button 
                            className="action-button submit-button"
                            onClick={handleReply}
                            disabled={!replyContent.trim()}
                        >
                            Reply
                        </button>
                    </div>
                </div>
            )}

            {showReplies && note.replies && note.replies.length > 0 && (
                <div className="replies-section">
                    {note.replies.map(reply => (
                        <div key={reply.id} className="reply">
                            <div className="reply-header">
                                <div className="author-info">
                                    <img 
                                        src={reply.author_avatar} 
                                        alt={reply.author_username} 
                                        className="author-avatar small"
                                    />
                                    <span className="reply-author">{reply.author_username}</span>
                                </div>
                                <span className="reply-time">{reply.time_ago}</span>
                            </div>
                            <p className="reply-content">{reply.content}</p>
                            {reply.edited && <span className="edited-tag small">(edited)</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Note;