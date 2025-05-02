import React from "react";
import "../style/Note.css"

function Note({note, onDelete}){
    const formattedDate = new Date(note.created_at).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true
    })

    return <div className="note-container">
        <p className="note-title">{note.title}</p>
        <p className="note-content">{note.content}</p>
        <p className="note-date">{formattedDate}</p>
        <p className="note-author">{note.author}</p>
        <button className="delete-button" onClick={() => onDelete(note.id)}>
            Delete
        </button>
    </div>
}

export default Note;