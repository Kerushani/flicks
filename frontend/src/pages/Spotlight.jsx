import { useState, useEffect } from "react"
import api from "../api"
import Note from "../components/Note"
import SoundtrackWidget from "../components/SoundtrackWidget"
import "../style/Home.css"
import "../style/MovieReviews.css"

const Spotlight = () => {
    const [posts, setPosts] = useState([]);
    const [postContent, setPostContent] = useState("");
    const [postTitle, setPostTitle] = useState("");
    const [dailyMovie, setDailyMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    
    const movieList = [
        "The Shawshank Redemption", "Pulp Fiction", "The Godfather",
        "Inception", "The Dark Knight", "Fight Club", "Forrest Gump",
        "The Matrix", "Goodfellas", "The Silence of the Lambs",
        "Se7en", "The Departed", "Gladiator", "The Prestige",
        "Memento", "The Green Mile", "Saving Private Ryan"
    ];

    const getDailyMovie = async () => {
        const today = new Date().toISOString().split('T')[0];
        const savedMovie = localStorage.getItem('dailyMovie');
        const savedDate = localStorage.getItem('movieDate');
        
        if (savedMovie && savedDate === today) {
            const movie = JSON.parse(savedMovie);
            setDailyMovie(movie);
            getMovieReviews(movie.imdbID);
            setLoading(false);
            return;
        }

        try {
            const dateNum = parseInt(today.replace(/-/g, ''));
            const movieIndex = dateNum % movieList.length;
            
            const title = movieList[movieIndex];
            const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=1e75925c`);
            const data = await res.json();
            
            if (data.Response === "True") {
                setDailyMovie(data);
                getMovieReviews(data.imdbID);
                localStorage.setItem('dailyMovie', JSON.stringify(data));
                localStorage.setItem('movieDate', today);
            }
        } catch (err) {
            console.error("Failed to fetch daily movie", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        getDailyMovie();
        getCurrentUser();
    }, []);

    const getCurrentUser = async () => {
        try {
            const response = await api.get("/api/profile/");
            setCurrentUser(response.data);
        } catch (err) {
            console.error("Failed to fetch current user:", err);
        }
    };

    const getMovieReviews = async (imdbId) => {
        try {
            const response = await api.get("/api/notes/", {
                params: { movie_imdb_id: imdbId }
            });
            setPosts(response.data);
        } catch (err) {
            console.error("Failed to fetch movie reviews:", err);
        }
    };

    const deletePost = async (id) => {
        try {
            const response = await api.delete(`/api/notes/delete/${id}/`);
            if (response.status === 204) {
                getMovieReviews(dailyMovie.imdbID);
            }
        } catch (error) {
            console.error("Error deleting post:", error);
        }
    };

    const editPost = async (id, newContent) => {
        try {
            const response = await api.put(`/api/notes/${id}/`, {
                content: newContent,
                movie_imdb_id: dailyMovie.imdbID,
                movie_title: dailyMovie.Title
            });
            if (response.status === 200) {
                getMovieReviews(dailyMovie.imdbID);
            }
        } catch (error) {
            console.error("Error editing post:", error);
        }
    };

    const replyToPost = async (parentId, content) => {
        try {
            const response = await api.post("/api/notes/", {
                title: "Reply",
                content: content,
                parent: parentId,
                movie_imdb_id: dailyMovie.imdbID,
                movie_title: dailyMovie.Title
            });
            if (response.status === 201) {
                getMovieReviews(dailyMovie.imdbID);
            }
        } catch (error) {
            console.error("Error replying to post:", error);
        }
    };

    const createPost = async (e) => {
        e.preventDefault();
        if (!postTitle.trim() || !postContent.trim()) {
            return;
        }
        try {
            const response = await api.post("/api/notes/", {
                title: postTitle,
                content: postContent,
                movie_imdb_id: dailyMovie.imdbID,
                movie_title: dailyMovie.Title
            });
            if (response.status === 201) {
                getMovieReviews(dailyMovie.imdbID);
                setPostTitle("");
                setPostContent("");
            }
        } catch (error) {
            console.error("Error creating post:", error);
        }
    };

    return (
        <div className="movie-review-page">
            <div className="main-content-grid">
                {/* Left Column - Featured Film */}
                <section className="daily-recommendation">
                    <h2>Today's Featured Film</h2>
                    {dailyMovie && (
                        <div className="featured-movie">
                            <div className="movie-poster">
                                <img 
                                    src={dailyMovie.Poster} 
                                    alt={dailyMovie.Title}
                                    onError={(e) => e.target.src = '/placeholder-poster.jpg'}
                                />
                            </div>
                            <div className="movie-details">
                                <h3>{dailyMovie.Title} <span className="year">({dailyMovie.Year})</span></h3>
                                <div className="movie-meta">
                                    <span>{dailyMovie.Runtime}</span> • 
                                    <span>{dailyMovie.Genre}</span> • 
                                    <span>⭐ {dailyMovie.imdbRating}</span>
                                </div>
                                <p className="movie-plot">{dailyMovie.Plot}</p>
                                <div className="movie-credits">
                                    <p><strong>Director:</strong> {dailyMovie.Director}</p>
                                    <p><strong>Stars:</strong> {dailyMovie.Actors}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Soundtrack Widget */}
                    {dailyMovie && (
                        <SoundtrackWidget movieTitle={dailyMovie.Title} />
                    )}
                </section>

                {/* Right Column - Community Section */}
                <section className="community-section">
                    <h2>Community Reviews</h2>

                    {/* Add Review Form */}
                    <div className="create-review">
                        <h3>Share Your Thoughts</h3>
                        <form onSubmit={createPost} className="review-form">
                            <input
                                type="text"
                                placeholder="Main highlight..."
                                required
                                value={postTitle}
                                onChange={(e) => setPostTitle(e.target.value)}
                                className="review-title-input"
                            />

                            <textarea
                                placeholder="Let's hear it..."
                                required
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                                className="review-content-input"
                                rows="4"
                            ></textarea>

                            <button type="submit" className="submit-review" disabled={!postTitle.trim() || !postContent.trim()}>
                                Post Review
                            </button>
                        </form>
                    </div>

                    {/* Reviews List */}
                    <div className="reviews-list">
                        {posts.length > 0 ? (
                            posts.map((post) => (
                                <Note 
                                    note={post} 
                                    onDelete={deletePost}
                                    onEdit={editPost}
                                    onReply={replyToPost}
                                    currentUser={currentUser}
                                    key={post.id} 
                                />
                            ))
                        ) : (
                            <p className="empty-state">No reviews yet. Be the first to share your thoughts!</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Spotlight;