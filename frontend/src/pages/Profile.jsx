import { useState, useEffect } from "react";
import api from "../api";

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [results, setResults] = useState([]);
    const [watchlist, setWatchlist] = useState([]);
    const [activeTab, setActiveTab] = useState("watchlist");
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState(null);
    const [localNotes, setLocalNotes] = useState("");
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [postTitle, setPostTitle] = useState("");
    const [postContent, setPostContent] = useState("");

    useEffect(() => {
        getUserProfile();
        getWatchlist();
    }, []);

    const getUserProfile = () => {
        api.get("/api/profile/")
            .then((res) => res.data)
            .then((data) => setProfile(data))
            .catch(() => alert("Could not get user info"));
    };

    const getWatchlist = async () => {
        try {
            const response = await api.get("/api/watchlist/");
            setWatchlist(response.data);
        } catch (error) {
            console.error("Failed to fetch watchlist:", error);
        }
    };

    const addToWatchlist = async (movie) => {
        try {
            await api.post("/api/watchlist/", {
                imdb_id: movie.imdbID,
                title: movie.Title,
                year: movie.Year,
                poster: movie.Poster,
                imdb_rating: movie.imdbRating
            });
            getWatchlist(); // Refresh the list
            setResults([]); // Clear search results
            setQuery(""); // Clear search query
        } catch (error) {
            alert("Failed to add movie to watchlist");
        }
    };

    const updateWatchlistItem = async (id, updates) => {
        try {
            const response = await api.put(`/api/watchlist/${id}/`, updates);
            if (response.status === 200) {
                // Update the item locally instead of refetching the entire list
                setWatchlist(prevList => 
                    prevList.map(item => 
                        item.id === id ? { ...item, ...updates } : item
                    )
                );
                // Also update the selected movie if it's the one being edited
                if (selectedMovie && selectedMovie.id === id) {
                    setSelectedMovie(prev => ({ ...prev, ...updates }));
                }
            }
        } catch (error) {
            alert("Failed to update movie");
        }
    };

    const removeFromWatchlist = async (id) => {
        try {
            await api.delete(`/api/watchlist/${id}/`);
            getWatchlist();
        } catch (error) {
            alert("Failed to remove movie from watchlist");
        }
    };

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }

        if (value.trim()) {
            const timeout = setTimeout(() => {
                handleSearch();
            }, 300);
            setTypingTimeout(timeout);
        } else {
            setResults([]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (query.trim()) {
                handleSearch();
            }
        }
    };

    const handleSearch = async () => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await api.get(`/api/search/`, {
                params: { q: query }
            });
            const data = response.data;
            setResults(data.Search || []);
        } catch (error) {
            setError("Failed to fetch movies.");
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMovieClick = (movie) => {
        setSelectedMovie(movie);
        setLocalNotes(movie.notes || "");
        setHasUnsavedChanges(false);
        setIsSlideoverOpen(true);
    };

    const handleNotesChange = (e) => {
        setLocalNotes(e.target.value);
        setHasUnsavedChanges(true);
    };

    const handleSaveNotes = async () => {
        try {
            await updateWatchlistItem(selectedMovie.id, { notes: localNotes });
            setHasUnsavedChanges(false);
        } catch (error) {
            alert("Failed to save notes");
        }
    };

    const createPost = (e) => {
        e.preventDefault();
        // Handle form submission
        console.log("Post title:", postTitle);
        console.log("Post content:", postContent);
        // Reset form fields
        setPostTitle("");
        setPostContent("");
    };

    if (!profile) return <h1>Loading...</h1>;

    const filteredWatchlist = watchlist.filter(item => 
        activeTab === "watchlist" ? !item.watched : item.watched
    );

    return (
        <div className="profile-page">
            <aside className="profile-sidebar">
                <div className="profile-info-card">
                    <img
                        src={profile.profile?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}&backgroundColor=9370DB`}
                        alt="Profile"
                        className="profile-avatar"
                    />
                    <h1 className="username">{profile.username}</h1>
                    <p className="email">{profile.email}</p>
                </div>
            </aside>

            <main className="main-content">
                <div className="watchlist-container">
                    <div className="watchlist-header">
                        <div className="search-section">
                            <h2>Add Movies to Your Watchlist</h2>
                            <div className="search-bar">
                                <div className="search-input-container">
                                    <input
                                        type="text"
                                        placeholder="Search for a movie..."
                                        value={query}
                                        onChange={handleSearchInputChange}
                                        onKeyDown={handleKeyDown}
                                        className="search-input"
                                    />
                                    {loading && <div className="search-loading">Searching...</div>}
                                    {results.length > 0 && (
                                        <div className="search-dropdown">
                                            {results.map((movie) => (
                                                <div key={movie.imdbID} className="dropdown-item" onClick={() => {
                                                    addToWatchlist(movie);
                                                    setQuery('');
                                                    setResults([]);
                                                }}>
                                                    <img
                                                        src={movie.Poster === "N/A" ? "/placeholder-poster.jpg" : movie.Poster}
                                                        alt={movie.Title}
                                                        onError={(e) => {
                                                            if (!e.target.dataset.fallback) {
                                                                e.target.dataset.fallback = 'true';
                                                                e.target.src = "/placeholder-poster.jpg";
                                                            }
                                                        }}
                                                    />
                                                    <div className="dropdown-item-info">
                                                        <span className="movie-title">{movie.Title}</span>
                                                        <div className="movie-meta">
                                                            <span className="movie-year">({movie.Year})</span>
                                                            {movie.imdbRating && movie.imdbRating !== 'N/A' && (
                                                                <span className="movie-rating">⭐ {movie.imdbRating}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button onClick={handleSearch}>Search</button>
                            </div>
                        </div>

                        <div className="tabs">
                            <button
                                className={activeTab === "watchlist" ? "active" : ""}
                                onClick={() => setActiveTab("watchlist")}
                            >
                                Watchlist
                            </button>
                            <button
                                className={activeTab === "watched" ? "active" : ""}
                                onClick={() => setActiveTab("watched")}
                            >
                                Watched
                            </button>
                        </div>
                    </div>

                    {loading && <div className="loading">Loading...</div>}
                    {error && <div className="error">{error}</div>}

                    <div className="watchlist-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Poster</th>
                                    <th>Title</th>
                                    <th>Year</th>
                                    <th>IMDb</th>
                                    <th>Your Rating</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWatchlist.map((item) => (
                                    <tr key={item.id} onClick={() => handleMovieClick(item)} className="movie-row">
                                        <td className="poster-cell">
                                            <img
                                                src={item.poster === "N/A" ? "/placeholder-poster.jpg" : item.poster}
                                                alt={item.title}
                                                onError={(e) => {
                                                    if (!e.target.dataset.fallback) {
                                                        e.target.dataset.fallback = 'true';
                                                        e.target.src = "/placeholder-poster.jpg";
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td>{item.title}</td>
                                        <td>{item.year}</td>
                                        <td>{item.imdb_rating ? `⭐ ${item.imdb_rating}` : '-'}</td>
                                        <td>
                                            {item.watched ? (
                                                <div className="rating-display">
                                                    {item.rating ? `${item.rating} ⭐` : 'Not rated'}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            {!item.watched ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateWatchlistItem(item.id, { watched: true });
                                                    }}
                                                    className="mark-watched"
                                                >
                                                    Mark as Watched
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFromWatchlist(item.id);
                                                    }}
                                                    className="remove-button"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Slide-over Panel */}
            {isSlideoverOpen && selectedMovie && (
                <div className="slideover-backdrop" onClick={() => {
                    if (hasUnsavedChanges) {
                        if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
                            setIsSlideoverOpen(false);
                        }
                    } else {
                        setIsSlideoverOpen(false);
                    }
                }}>
                    <div className="slideover-panel" onClick={e => e.stopPropagation()}>
                        <div className="slideover-header">
                            <h3>{selectedMovie.title}</h3>
                            <button 
                                onClick={() => {
                                    if (hasUnsavedChanges) {
                                        if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
                                            setIsSlideoverOpen(false);
                                        }
                                    } else {
                                        setIsSlideoverOpen(false);
                                    }
                                }} 
                                className="close-button"
                            >
                                ×
                            </button>
                        </div>
                        <div className="slideover-content">
                            <div className="movie-details">
                                <img
                                    src={selectedMovie.poster === "N/A" ? "/placeholder-poster.jpg" : selectedMovie.poster}
                                    alt={selectedMovie.title}
                                    className="detail-poster"
                                />
                                <div className="detail-info">
                                    <p className="year">{selectedMovie.year}</p>
                                    {selectedMovie.watched && (
                                        <div className="rating-section">
                                            <label>Rating:</label>
                                            <select
                                                value={selectedMovie.rating || ""}
                                                onChange={(e) => updateWatchlistItem(selectedMovie.id, { rating: e.target.value })}
                                            >
                                                <option value="">Select Rating</option>
                                                {[1,2,3,4,5].map(num => (
                                                    <option key={num} value={num}>{num} ⭐</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="notes-section">
                                <div className="notes-header">
                                    <label>Notes:</label>
                                    {hasUnsavedChanges && (
                                        <span className="unsaved-indicator">Unsaved changes</span>
                                    )}
                                </div>
                                <textarea
                                    placeholder="Add your thoughts about this movie..."
                                    value={localNotes}
                                    onChange={handleNotesChange}
                                    className="notes-input"
                                />
                                <button 
                                    onClick={handleSaveNotes}
                                    className={`save-notes-button ${hasUnsavedChanges ? 'has-changes' : ''}`}
                                    disabled={!hasUnsavedChanges}
                                >
                                    Save Notes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .profile-page {
                    display: grid;
                    grid-template-columns: minmax(300px, 400px) minmax(600px, 3fr);
                    gap: 10px;
                    width: 98%;
                    max-width: 2000px;
                    margin: 0 auto;
                    padding: 0;
                    padding-top: 4rem;
                }

                .profile-sidebar {
                    position: sticky;
                    top: 4rem;
                    height: fit-content;
                }

                .profile-info-card {
                    background: #141414;
                    padding: 1rem;
                    border-radius: 12px;
                    border: 1px solid #2a2a2a;
                    text-align: center;
                    margin: 0;
                }

                .profile-avatar {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    margin: 0 auto 0.75rem;
                    border: 3px solid #2a2a2a;
                    background: #1a1a1a;
                    padding: 0;
                    transition: all 0.2s ease;
                }

                .profile-avatar:hover {
                    transform: scale(1.02);
                    border-color: #9370DB;
                    box-shadow: 0 0 20px rgba(147, 112, 219, 0.2);
                }

                .username {
                    font-size: 1.5rem;
                    color: #ffffff;
                    margin-bottom: 0.25rem;
                }

                .email {
                    color: #888888;
                    font-size: 0.9rem;
                    margin-bottom: 0;
                }

                .main-content {
                    min-width: 0;
                }

                .watchlist-container {
                    background: #141414;
                    border-radius: 12px;
                    border: 1px solid #2a2a2a;
                    padding: 1rem;
                    margin: 0;
                }

                .watchlist-header {
                    margin-bottom: 1rem;
                }

                .search-section {
                    margin-bottom: 1rem;
                }

                .search-section h2 {
                    color: #ffffff;
                    margin-bottom: 0.75rem;
                    font-size: 1.3rem;
                    font-weight: 600;
                }

                .search-bar {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 0;
                    position: relative;
                    width: 100%;
                }

                .search-input-container {
                    position: relative;
                    flex: 1;
                    max-width: 450px;
                }

                .search-input {
                    width: 100%;
                    padding: 0.8rem 1rem;
                    font-size: 1rem;
                    border-radius: 8px;
                    border: 2px solid #2a2a2a;
                    background: #1a1a1a;
                    color: #ffffff;
                    transition: all 0.2s ease;
                }

                .search-bar button {
                    padding: 0.8rem 1.5rem;
                    font-size: 1rem;
                    background: #9370DB;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.2s ease;
                    font-weight: 500;
                    min-width: 100px;
                    position: relative;
                    z-index: 2;
                }

                .watchlist-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 2rem;
                    padding: 1rem 0;
                    margin-top: 2rem;
                }

                .watchlist-tabs {
                    display: flex;
                    gap: 1rem;
                    margin-top: 0;
                    border-bottom: 2px solid #2a2a2a;
                    padding-bottom: 1.5rem;
                }

                .watchlist-tabs button {
                    padding: 1rem 2rem;
                    background: transparent;
                    border: 2px solid #2a2a2a;
                    border-radius: 12px;
                    color: #888888;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: 500;
                    min-width: 140px;
                    font-size: 1.1rem;
                }

                .watchlist-tabs button:hover {
                    border-color: #9370DB;
                    color: #9370DB;
                }

                .watchlist-tabs button.active {
                    background: #9370DB;
                    color: white;
                    border-color: #9370DB;
                }

                .watchlist-card {
                    background: #1a1a1a;
                    border-radius: 12px;
                    overflow: hidden;
                    transition: all 0.2s ease;
                    border: 1px solid #2a2a2a;
                }

                .watchlist-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                    border-color: #9370DB;
                }

                .watchlist-card img {
                    width: 100%;
                    aspect-ratio: 2/3;
                    object-fit: cover;
                }

                .watchlist-card-info {
                    padding: 1.5rem;
                }

                .watchlist-card-info h3 {
                    color: #ffffff;
                    font-size: 1.1rem;
                    margin-bottom: 0.8rem;
                    line-height: 1.4;
                }

                .watchlist-card-info p {
                    color: #888888;
                    font-size: 1rem;
                    margin-bottom: 1.2rem;
                }

                .mark-watched {
                    width: 100%;
                    padding: 0.9rem;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    margin-bottom: 1rem;
                    transition: all 0.2s ease;
                    font-weight: 500;
                    font-size: 1rem;
                }

                .mark-watched:hover {
                    background: #45a049;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
                }

                .rating-section select {
                    width: 100%;
                    padding: 0.9rem;
                    background: #2a2a2a;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    margin-bottom: 1rem;
                    cursor: pointer;
                    font-family: inherit;
                    font-size: 1rem;
                    appearance: none;
                    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
                    background-repeat: no-repeat;
                    background-position: right 1rem center;
                    background-size: 0.8em auto;
                }

                .rating-section select:hover {
                    background-color: #333333;
                }

                .notes-input {
                    width: 100%;
                    min-height: 100px;
                    padding: 1rem;
                    background: #2a2a2a;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    margin-bottom: 1rem;
                    resize: vertical;
                    font-family: inherit;
                    font-size: 1rem;
                    line-height: 1.5;
                    transition: all 0.2s ease;
                }

                .notes-input:focus {
                    outline: none;
                    background: #333333;
                    box-shadow: 0 0 0 2px rgba(147, 112, 219, 0.3);
                }

                .remove-button {
                    width: 100%;
                    padding: 0.9rem;
                    background: #ff4444;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: 500;
                    font-size: 1rem;
                }

                .remove-button:hover {
                    background: #ff3333;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(255, 68, 68, 0.2);
                }

                .search-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    width: 100%;
                    background: #1a1a1a;
                    border: 2px solid #2a2a2a;
                    border-radius: 8px;
                    max-height: 350px;
                    overflow-y: auto;
                    z-index: 1000;
                    margin-top: 0.25rem;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                }

                .dropdown-item {
                    display: flex;
                    align-items: center;
                    padding: 0.75rem;
                    cursor: pointer;
                    border-bottom: 1px solid #2a2a2a;
                    transition: all 0.2s ease;
                }

                .dropdown-item:last-child {
                    border-bottom: none;
                }

                .dropdown-item img {
                    width: 40px;
                    height: 60px;
                    object-fit: cover;
                    border-radius: 4px;
                    margin-right: 0.75rem;
                }

                .dropdown-item-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                    flex: 1;
                    min-width: 0;
                }

                .movie-title {
                    color: #ffffff;
                    font-size: 0.95rem;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .movie-meta {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 2px;
                }

                .movie-year,
                .movie-rating {
                    color: #888888;
                    font-size: 0.85rem;
                }

                .movie-rating {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    color: #ffd700;
                }

                @media (max-width: 1024px) {
                    .profile-page {
                        grid-template-columns: 1fr;
                        gap: 10px;
                        padding: 0;
                        padding-top: 4rem;
                    }

                    .profile-sidebar {
                        position: relative;
                        top: 0;
                        max-width: 400px;
                        margin: 0 auto;
                    }
                }

                @media (max-width: 768px) {
                    .profile-page {
                        width: 100%;
                        padding: 0;
                        padding-top: 4rem;
                        gap: 10px;
                    }
                }

                .tabs {
                    display: flex;
                    border-bottom: 2px solid #2a2a2a;
                    margin-bottom: 2rem;
                }

                .tabs button {
                    padding: 1rem 2rem;
                    background: transparent;
                    border: none;
                    color: #888888;
                    cursor: pointer;
                    font-size: 1.1rem;
                    font-weight: 500;
                    position: relative;
                    transition: all 0.2s ease;
                }

                .tabs button:hover {
                    color: #ffffff;
                }

                .tabs button.active {
                    color: #9370DB;
                }

                .tabs button.active::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: #9370DB;
                }

                .watchlist-table {
                    width: 100%;
                    overflow-x: auto;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                th {
                    text-align: left;
                    padding: 1rem;
                    color: #888888;
                    font-weight: 500;
                    border-bottom: 1px solid #2a2a2a;
                }

                .movie-row {
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .movie-row:hover {
                    background: #1a1a1a;
                }

                td {
                    padding: 1rem;
                    border-bottom: 1px solid #2a2a2a;
                    color: #ffffff;
                }

                .poster-cell {
                    width: 60px;
                }

                .poster-cell img {
                    width: 45px;
                    height: 68px;
                    object-fit: cover;
                    border-radius: 6px;
                }

                .rating-display {
                    color: #888888;
                }

                .slideover-backdrop {
                    position: fixed;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: flex-end;
                    z-index: 1000;
                }

                .slideover-panel {
                    background: #141414;
                    width: 100%;
                    max-width: 500px;
                    height: 100%;
                    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
                    animation: slideIn 0.3s ease-out;
                    display: flex;
                    flex-direction: column;
                }

                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }

                .slideover-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 2rem 2.5rem;
                    border-bottom: 1px solid #2a2a2a;
                }

                .slideover-header h3 {
                    font-size: 1.5rem;
                    color: #ffffff;
                    margin: 0;
                }

                .close-button {
                    background: transparent;
                    border: none;
                    color: #888888;
                    font-size: 2rem;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                    transition: color 0.2s ease;
                }

                .close-button:hover {
                    color: #ffffff;
                }

                .slideover-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 2.5rem;
                }

                .movie-details {
                    display: flex;
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .detail-poster {
                    width: 120px;
                    height: 180px;
                    object-fit: cover;
                    border-radius: 8px;
                }

                .detail-info {
                    flex: 1;
                }

                .year {
                    color: #888888;
                    font-size: 1.1rem;
                    margin: 0 0 1rem;
                }

                .rating-section {
                    margin-top: 1rem;
                }

                .rating-section label {
                    display: block;
                    color: #888888;
                    margin-bottom: 0.8rem;
                    font-size: 1.1rem;
                }

                .notes-section {
                    margin-top: 2rem;
                }

                .notes-section label {
                    display: block;
                    color: #888888;
                    margin-bottom: 0.8rem;
                    font-size: 1.1rem;
                }

                .notes-input {
                    width: 100%;
                    min-height: 120px;
                    padding: 1rem;
                    background: #2a2a2a;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    resize: vertical;
                    font-family: inherit;
                    font-size: 1rem;
                    line-height: 1.5;
                    transition: all 0.2s ease;
                }

                .notes-input:focus {
                    outline: none;
                    background: #333333;
                    box-shadow: 0 0 0 2px rgba(147, 112, 219, 0.3);
                }

                @media (max-width: 1024px) {
                    .slideover-panel {
                        max-width: 400px;
                    }
                }

                @media (max-width: 640px) {
                    .slideover-panel {
                        max-width: none;
                    }

                    .tabs button {
                        padding: 0.8rem 1.5rem;
                        font-size: 1rem;
                    }

                    th, td {
                        padding: 0.8rem;
                    }
                }

                .notes-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.8rem;
                }

                .unsaved-indicator {
                    font-size: 0.9rem;
                    color: #ffd700;
                    font-style: italic;
                }

                .save-notes-button {
                    margin-top: 1rem;
                    padding: 0.8rem 1.5rem;
                    background: #2a2a2a;
                    color: #888888;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                    width: 100%;
                }

                .save-notes-button.has-changes {
                    background: #9370DB;
                    color: white;
                }

                .save-notes-button:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(147, 112, 219, 0.2);
                }

                .save-notes-button:disabled {
                    cursor: not-allowed;
                    opacity: 0.5;
                }

                .create-review {
                    border-top: 1px solid #2a2a2a;
                    padding-top: 15px;
                    min-height: 150px;
                }

                .create-review h3 {
                    color: #ffffff;
                    font-size: 1.2rem;
                    margin-bottom: 12px;
                    font-weight: 600;
                }

                .review-form {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .review-title-input {
                    width: 100%;
                    min-height: 45px;
                    max-height: 100px;
                    padding: 12px 14px;
                    background: #1a1a1a;
                    border: 1px solid #2a2a2a;
                    border-radius: 8px;
                    color: #ffffff;
                    font-size: 1rem;
                    font-family: inherit;
                    resize: vertical;
                    transition: all 0.2s ease;
                }

                .review-content-input {
                    width: 100%;
                    min-height: 120px;
                    padding: 12px 14px;
                    background: #1a1a1a;
                    border: 1px solid #2a2a2a;
                    border-radius: 8px;
                    color: #ffffff;
                    font-size: 1rem;
                    font-family: inherit;
                    resize: vertical;
                    line-height: 1.5;
                    transition: all 0.2s ease;
                }

                .review-title-input:focus,
                .review-content-input:focus {
                    outline: none;
                    border-color: #9370DB;
                    background: #242424;
                    box-shadow: 0 0 0 2px rgba(147, 112, 219, 0.1);
                }

                .review-title-input::placeholder,
                .review-content-input::placeholder {
                    color: #666666;
                }

                .submit-review {
                    background: #9370DB;
                    color: #ffffff;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-size: 1rem;
                    cursor: pointer;
                    font-family: inherit;
                    transition: all 0.2s ease;
                    font-weight: 500;
                    margin-top: 0.5rem;
                }

                .submit-review:hover:not(:disabled) {
                    background: #8A5CD1;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(147, 112, 219, 0.2);
                }

                .submit-review:disabled {
                    background: #4a4a4a;
                    cursor: not-allowed;
                    opacity: 0.7;
                }

                .review-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .review-form-label {
                    color: #888888;
                    font-size: 0.9rem;
                    font-weight: 500;
                    margin-left: 2px;
                }
            `}</style>
        </div>
    );
};

export default Profile;

