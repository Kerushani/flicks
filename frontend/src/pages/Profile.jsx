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
    const [movieDetails, setMovieDetails] = useState(null);
    const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState(null);
    const [localNotes, setLocalNotes] = useState("");
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [postTitle, setPostTitle] = useState("");
    const [postContent, setPostContent] = useState("");

    useEffect(() => {
        const loadUserData = async () => {
            setLoading(true);
            try {
                await Promise.all([getUserProfile(), getWatchlist()]);
            } catch (error) {
                console.error("Failed to load user data:", error);
                setError("Failed to load user data");
            } finally {
                setLoading(false);
            }
        };
        
        loadUserData();
    }, []);

    const getUserProfile = async () => {
        try {
            const response = await api.get("/api/profile/");
            setProfile(response.data);
            return response.data;
        } catch (error) {
            console.error("Could not get user info:", error);
            throw error;
        }
    };

    const getWatchlist = async () => {
        try {
            const response = await api.get("/api/watchlist/");
            setWatchlist(response.data);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch watchlist:", error);
            throw error;
        }
    };

    const addToWatchlist = async (movie) => {
        try {
            await api.post("/api/watchlist/", {
                imdb_id: movie.imdbID,
                title: movie.Title,
                year: movie.Year,
                poster: movie.Poster,
                imdb_rating: movie.imdbRating || 'N/A'
            });
            await getWatchlist(); // Refresh the list
            setResults([]); // Clear search results
            setQuery(""); // Clear search query
        } catch (error) {
            if (error.response?.data?.error === 'Movie already in watchlist') {
                alert("This movie is already in your watchlist");
            } else {
                console.error("Failed to add movie:", error.response?.data || error.message);
                alert("Failed to add movie to watchlist");
            }
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

    const handleMovieClick = async (movie) => {
        setSelectedMovie(movie);
        setLocalNotes(movie.notes || "");
        setHasUnsavedChanges(false);
        setIsSlideoverOpen(true);
        
        try {
            const response = await api.get(`/api/search/`, {
                params: { q: movie.imdb_id }
            });
            if (response.data.Search && response.data.Search[0]) {
                setMovieDetails(response.data.Search[0]);
            }
        } catch (error) {
            console.error("Failed to fetch movie details:", error);
        }
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

    if (loading && !profile) return <div className="loading-state">Loading...</div>;
    if (error) return <div className="error-state">Error: {error}</div>;
    if (!profile) return null;

    const filteredWatchlist = watchlist.filter(item => 
        activeTab === "watchlist" ? !item.watched : item.watched
    );

    return (
        <div className="profile-container">
            {/* Profile Header */}
            <header className="profile-header">
                <div className="profile-info">
                    <img
                        src={profile.profile?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}&backgroundColor=9370DB`}
                        alt="Profile"
                        className="profile-avatar"
                    />
                    <div className="profile-text">
                        <h1 className="username">{profile.username}</h1>
                        <p className="email">{profile.email}</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="profile-content">
                {/* Search Widget */}
                <div className="search-widget">
                    <h2>Add to Watchlist</h2>
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search for movies..."
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                if (typingTimeout) clearTimeout(typingTimeout);
                                if (e.target.value.trim()) {
                                    const timeout = setTimeout(() => handleSearch(), 300);
                                    setTypingTimeout(timeout);
                                } else {
                                    setResults([]);
                                }
                            }}
                            className="search-input"
                        />
                        {loading && <div className="search-loading">Searching...</div>}
                    </div>
                    {results.length > 0 && (
                        <div className="search-results">
                            {results.map((movie) => (
                                <div key={movie.imdbID} className="search-result-item" onClick={() => addToWatchlist(movie)}>
                                    <img
                                        src={movie.Poster === "N/A" ? "/placeholder-poster.jpg" : movie.Poster}
                                        alt={movie.Title}
                                        className="movie-poster"
                                    />
                                    <div className="movie-info">
                                        <h3>{movie.Title}</h3>
                                        <div className="movie-meta">
                                            <span className="year">{movie.Year}</span>
                                            {movie.imdbRating && movie.imdbRating !== 'N/A' && (
                                                <span className="rating">⭐ {movie.imdbRating}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Watchlist Table */}
                <div className="watchlist-widget">
                    <div className="watchlist-header">
                        <h2>My Movies</h2>
                        <div className="tabs">
                            <button
                                className={activeTab === "watchlist" ? "active" : ""}
                                onClick={() => setActiveTab("watchlist")}
                            >
                                Want to Watch
                            </button>
                            <button
                                className={activeTab === "watched" ? "active" : ""}
                                onClick={() => setActiveTab("watched")}
                            >
                                Watched
                            </button>
                        </div>
                    </div>

                    <div className="table-container">
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
                                {filteredWatchlist.map((movie) => (
                                    <tr key={movie.id} onClick={() => handleMovieClick(movie)} className="movie-row">
                                        <td className="poster-cell">
                                            <img
                                                src={movie.poster === "N/A" ? "/placeholder-poster.jpg" : movie.poster}
                                                alt={movie.title}
                                                className="movie-poster"
                                            />
                                        </td>
                                        <td className="title-cell">{movie.title}</td>
                                        <td>{movie.year}</td>
                                        <td>{movie.imdb_rating ? `⭐ ${movie.imdb_rating}` : '-'}</td>
                                        <td>
                                            {movie.watched ? (
                                                <div className="rating-display">
                                                    {movie.rating ? `${movie.rating} ⭐` : 'Not rated'}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            {!movie.watched ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateWatchlistItem(movie.id, { watched: true });
                                                    }}
                                                    className="action-button watch-button"
                                                >
                                                    Mark as Watched
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFromWatchlist(movie.id);
                                                    }}
                                                    className="action-button remove-button"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredWatchlist.length === 0 && (
                            <div className="empty-state">
                                <p>No movies in your {activeTab === "watchlist" ? "watchlist" : "watched list"} yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isSlideoverOpen && selectedMovie && (
                <div className="slideover-backdrop" onClick={() => {
                    if (hasUnsavedChanges) {
                        if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
                            setIsSlideoverOpen(false);
                            setMovieDetails(null);
                        }
                    } else {
                        setIsSlideoverOpen(false);
                        setMovieDetails(null);
                    }
                }}>
                    <div className="slideover-panel" onClick={e => e.stopPropagation()}>
                        <div className="slideover-header">
                            <h3>{selectedMovie.title}</h3>
                            <button className="close-button" onClick={() => {
                                setIsSlideoverOpen(false);
                                setMovieDetails(null);
                            }}>×</button>
                        </div>
                        <div className="slideover-content">
                            <div className="movie-details">
                                <img
                                    src={selectedMovie.poster}
                                    alt={selectedMovie.title}
                                    className="detail-poster"
                                />
                                <div className="detail-info">
                                    <div className="movie-header">
                                        <p className="year">{selectedMovie.year}</p>
                                        <p className="imdb-rating">IMDb: ⭐ {selectedMovie.imdb_rating}</p>
                                    </div>
                                    
                                    {movieDetails && (
                                        <>
                                            <div className="movie-meta">
                                                {movieDetails.Runtime && <span>{movieDetails.Runtime}</span>}
                                                {movieDetails.Genre && <span>{movieDetails.Genre}</span>}
                                            </div>
                                            <p className="movie-plot">{movieDetails.Plot}</p>
                                            <div className="movie-credits">
                                                {movieDetails.Director && (
                                                    <p><strong>Director:</strong> {movieDetails.Director}</p>
                                                )}
                                                {movieDetails.Actors && (
                                                    <p><strong>Stars:</strong> {movieDetails.Actors}</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                    
                                    {selectedMovie.watched && (
                                        <div className="rating-section">
                                            <label>Your Rating:</label>
                                            <select
                                                value={selectedMovie.rating || ""}
                                                onChange={(e) => updateWatchlistItem(selectedMovie.id, { rating: e.target.value })}
                                                className="rating-select"
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
                                    value={localNotes}
                                    onChange={handleNotesChange}
                                    placeholder="Add your thoughts about this movie..."
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
                .profile-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 4rem 2rem 2rem 2rem;
                    min-height: 100vh;
                    width: 100%;
                    box-sizing: border-box;
                }

                .profile-header {
                    background: #141414;
                    border-radius: 16px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                    border: 1px solid #2a2a2a;
                }

                .profile-info {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                }

                .profile-avatar {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    border: 3px solid #2a2a2a;
                    transition: all 0.2s ease;
                }

                .profile-text {
                    flex: 1;
                }

                .username {
                    font-size: 2rem;
                    color: #ffffff;
                    margin: 0;
                }

                .email {
                    color: #888888;
                    margin: 0.5rem 0 0;
                    font-size: 1rem;
                }

                .profile-content {
                    display: grid;
                    grid-template-columns: 320px minmax(0, 1fr);
                    gap: 2rem;
                    align-items: start;
                    position: relative;
                    width: 100%;
                }

                .search-widget {
                    background: #141414;
                    border-radius: 16px;
                    padding: 1.25rem;
                    border: 1px solid #2a2a2a;
                    position: sticky;
                    top: 2rem;
                    display: flex;
                    flex-direction: column;
                    max-height: calc(100vh - 8rem);
                    overflow: hidden;
                    width: 100%;
                    box-sizing: border-box;
                }

                .search-widget h2 {
                    color: #ffffff;
                    margin: 0 0 1rem;
                    font-size: 1.3rem;
                    flex-shrink: 0;
                    padding: 0 0.25rem;
                }

                .search-bar {
                    position: relative;
                    margin-bottom: 1rem;
                    flex-shrink: 0;
                    width: 100%;
                    box-sizing: border-box;
                }

                .search-input {
                    width: 100%;
                    padding: 0.8rem 1rem;
                    background: #1a1a1a;
                    border: 1px solid #2a2a2a;
                    border-radius: 8px;
                    color: #ffffff;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                    box-sizing: border-box;
                }

                .search-input:focus {
                    outline: none;
                    border-color: #9370DB;
                    box-shadow: 0 0 0 2px rgba(147, 112, 219, 0.1);
                }

                .search-results {
                    flex: 1;
                    overflow-y: auto;
                    margin: 0 -0.25rem;
                    padding: 0 0.25rem;
                    min-height: 0;
                }

                .search-result-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    cursor: pointer;
                    background: #1a1a1a;
                    border: 1px solid #2a2a2a;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    margin-bottom: 0.5rem;
                    width: 100%;
                    box-sizing: border-box;
                }

                .search-result-item:last-child {
                    margin-bottom: 0;
                }

                .search-result-item:hover {
                    background: #242424;
                    border-color: #9370DB;
                }

                .search-result-item img {
                    width: 35px;
                    height: 52px;
                    object-fit: cover;
                    border-radius: 4px;
                    flex-shrink: 0;
                }

                .movie-info {
                    flex: 1;
                    min-width: 0;
                    padding: 0.25rem 0;
                }

                .movie-info h3 {
                    margin: 0;
                    font-size: 0.9rem;
                    color: #ffffff;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .movie-meta {
                    display: flex;
                    gap: 0.75rem;
                    margin-top: 0.25rem;
                    color: #888888;
                    font-size: 0.8rem;
                }

                .search-loading {
                    text-align: center;
                    color: #888888;
                    padding: 0.5rem;
                    font-style: italic;
                    font-size: 0.9rem;
                    flex-shrink: 0;
                }

                /* Custom scrollbar for search results */
                .search-results::-webkit-scrollbar {
                    width: 6px;
                }

                .search-results::-webkit-scrollbar-track {
                    background: #1a1a1a;
                    border-radius: 3px;
                }

                .search-results::-webkit-scrollbar-thumb {
                    background: #2a2a2a;
                    border-radius: 3px;
                }

                .search-results::-webkit-scrollbar-thumb:hover {
                    background: #3a3a3a;
                }

                .watchlist-widget {
                    background: #141414;
                    border-radius: 16px;
                    padding: 1.5rem;
                    border: 1px solid #2a2a2a;
                    width: 100%;
                    box-sizing: border-box;
                }

                .watchlist-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .watchlist-header h2 {
                    color: #ffffff;
                    margin: 0;
                    font-size: 1.3rem;
                }

                .tabs {
                    display: flex;
                    gap: 1rem;
                }

                .tabs button {
                    padding: 0.6rem 1.2rem;
                    background: transparent;
                    border: 1px solid #2a2a2a;
                    border-radius: 8px;
                    color: #888888;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 0.9rem;
                }

                .tabs button.active {
                    background: #9370DB;
                    color: #ffffff;
                    border-color: #9370DB;
                }

                .table-container {
                    width: 100%;
                    overflow-x: auto;
                }

                table {
                    width: 100%;
                    min-width: 800px;
                    border-collapse: collapse;
                    table-layout: fixed;
                }

                th, td {
                    padding: 1rem;
                    border-bottom: 1px solid #2a2a2a;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .poster-cell {
                    width: 60px;
                }

                .poster-cell img {
                    width: 35px;
                    height: 52px;
                    object-fit: cover;
                    border-radius: 4px;
                }

                .title-cell {
                    width: 30%;
                }

                th:nth-child(3), /* Year column */
                td:nth-child(3) {
                    width: 100px;
                }

                th:nth-child(4), /* IMDb column */
                td:nth-child(4) {
                    width: 100px;
                }

                th:nth-child(5), /* Rating column */
                td:nth-child(5) {
                    width: 120px;
                }

                th:nth-child(6), /* Actions column */
                td:nth-child(6) {
                    width: 150px;
                }

                .movie-row {
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .movie-row:hover {
                    background: #1a1a1a;
                }

                .action-button {
                    padding: 0.6rem 1rem;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .watch-button {
                    background: #4CAF50;
                    color: white;
                }

                .watch-button:hover {
                    background: #45a049;
                }

                .remove-button {
                    background: #ff4444;
                    color: white;
                }

                .remove-button:hover {
                    background: #ff3333;
                }

                .empty-state {
                    text-align: center;
                    padding: 3rem;
                    color: #888888;
                    font-style: italic;
                }

                .slideover-backdrop {
                    position: fixed;
                    inset: 0;
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
                    animation: slideIn 0.3s ease-out;
                    overflow-y: auto;
                    padding: 0;
                }

                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }

                .slideover-header {
                    position: sticky;
                    top: 0;
                    background: #141414;
                    padding: 1.5rem;
                    border-bottom: 1px solid #2a2a2a;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    z-index: 10;
                }

                .slideover-content {
                    padding: 1.5rem;
                    height: calc(100% - 70px);
                    overflow-y: auto;
                    box-sizing: border-box;
                }

                .detail-poster {
                    width: 180px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }

                .detail-info {
                    flex: 1;
                    min-width: 0;
                }

                .movie-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }

                .year, .imdb-rating {
                    color: #888888;
                    font-size: 0.9rem;
                    margin: 0;
                }

                .movie-meta {
                    display: flex;
                    gap: 1rem;
                    color: #888888;
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
                    flex-wrap: wrap;
                }

                .movie-plot {
                    color: #e0e0e0;
                    font-size: 0.95rem;
                    line-height: 1.6;
                    margin-bottom: 1rem;
                }

                .movie-credits {
                    color: #888888;
                    font-size: 0.9rem;
                }

                .movie-credits p {
                    margin: 0.5rem 0;
                }

                .movie-credits strong {
                    color: #ffffff;
                    margin-right: 0.5rem;
                }

                .rating-select {
                    width: 100%;
                    padding: 0.8rem;
                    background: #1a1a1a;
                    border: 1px solid #2a2a2a;
                    border-radius: 8px;
                    color: #ffffff;
                    margin-top: 0.5rem;
                }

                .notes-section {
                    border-top: 1px solid #2a2a2a;
                    padding-top: 1.5rem;
                    margin-top: 1.5rem;
                    width: 100%;
                    box-sizing: border-box;
                }

                .notes-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    width: 100%;
                }

                .notes-header label {
                    color: #ffffff;
                    font-size: 1rem;
                    font-weight: 500;
                }

                .unsaved-indicator {
                    color: #888888;
                    font-size: 0.9rem;
                    font-style: italic;
                }

                .notes-input {
                    width: 100%;
                    min-height: 120px;
                    padding: 1rem;
                    background: #1a1a1a;
                    border: 1px solid #2a2a2a;
                    border-radius: 8px;
                    color: #ffffff;
                    font-size: 0.95rem;
                    font-family: 'Open Sans', sans-serif;
                    resize: vertical;
                    margin-bottom: 1rem;
                    box-sizing: border-box;
                    line-height: 1.5;
                }

                .notes-input:focus {
                    outline: none;
                    border-color: #9370DB;
                    box-shadow: 0 0 0 2px rgba(147, 112, 219, 0.1);
                }

                .save-notes-button {
                    width: 100%;
                    padding: 0.8rem;
                    background: #2a2a2a;
                    color: #888888;
                    border: none;
                    border-radius: 8px;
                    cursor: not-allowed;
                    opacity: 0.7;
                    font-size: 0.95rem;
                    font-family: 'Open Sans', sans-serif;
                    transition: all 0.2s ease;
                }

                .save-notes-button.has-changes {
                    background: #9370DB;
                    color: white;
                    cursor: pointer;
                    opacity: 1;
                }

                .save-notes-button.has-changes:hover {
                    background: #7B68EE;
                    transform: translateY(-1px);
                }

                @media (max-width: 1024px) {
                    .profile-content {
                        grid-template-columns: 1fr;
                    }

                    .search-widget {
                        position: relative;
                        top: 0;
                        max-height: 500px;
                    }

                    table {
                        min-width: 700px;
                    }
                }

                @media (max-width: 768px) {
                    .profile-container {
                        padding: 2rem 1rem 1rem 1rem;
                    }

                    .profile-info {
                        flex-direction: column;
                        text-align: center;
                    }

                    .watchlist-header {
                        flex-direction: column;
                        gap: 1rem;
                    }

                    th, td {
                        padding: 0.8rem;
                    }
                }

                .loading-state,
                .error-state {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 200px;
                    font-size: 1.1rem;
                    color: #888888;
                    text-align: center;
                    padding: 2rem;
                    background: #141414;
                    border-radius: 16px;
                    border: 1px solid #2a2a2a;
                    margin: 2rem auto;
                    max-width: 400px;
                }

                .error-state {
                    color: #ff4444;
                    border-color: #ff4444;
                }
            `}</style>
        </div>
    );
};

export default Profile;

