import { useState, useEffect } from "react";
import api from "../api";

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [results, setResults] = useState([]);

    useEffect(() => {
        getUserProfile();
    }, []);

    const getUserProfile = () => {
        api.get("/api/profile/")
            .then((res) => res.data)
            .then((data) => setProfile(data))
            .catch(() => alert("Could not get user info"));
    };

    if (!profile) return <h1>Loading...</h1>;

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setError("");

        try {
            const response = await api.get(`/api/search-movie/?q=${encodeURIComponent(query)}`);
            const data = response.data;
            setResults(data.Search || []);
        } catch (error) {
            setError("Failed to fetch movies.");
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSearch();
    };

    return (
        <div
            style={{
                maxWidth: "900px",
                margin: "2rem auto",
                marginTop: "100px",
                fontFamily: "'Helvetica Neue', sans-serif",
                padding: "0 1rem",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                <img
                    src={
                        profile.profilePicture ||
                        `https://ui-avatars.com/api/?name=${profile.username}&background=random`
                    }
                    alt="Profile"
                    style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "50%",
                        objectFit: "cover",
                    }}
                />

                <div>
                    <h2 style={{ marginBottom: "0.5rem", fontSize: "1.5rem" }}>
                        {profile.username}
                    </h2>
                    <p style={{ color: "#333" }}>{profile.email}</p>
                </div>
            </div>
            <div>
                <h2>Search for Movies</h2>
                <div style={{ position: "relative" }}>
                    <input
                        type="text"
                        placeholder="Search for a movie..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{
                            width: "100%",
                            padding: "10px",
                            fontSize: "1rem",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                        }}
                    />
                    <button
                        onClick={handleSearch}
                        style={{
                            padding: "10px 20px",
                            marginTop: "10px",
                            fontSize: "1rem",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                        }}
                    >
                        Search
                    </button>

                    {loading && <div>Loading...</div>}
                    {error && <p>{error}</p>}

                    {results.length > 0 && query && (
                        <div
                            style={{
                                position: "absolute",
                                top: "40px",
                                left: "0",
                                right: "0",
                                backgroundColor: "white",
                                borderRadius: "4px",
                                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                                maxHeight: "300px",
                                overflowY: "auto",
                                zIndex: 10,
                                padding: "10px 0",
                            }}
                        >
                {results.map((movie) => {
                    return (
                        <div
                            key={movie.imdbID}
                            style={{
                                display: "flex",
                                padding: "10px",
                                alignItems: "center",
                                gap: "10px",
                                cursor: "pointer",
                            }}
                        >
                            <img
                                src={movie.Poster !== "N/A" ? movie.Poster : " "}
                                alt={movie.Title}
                                style={{
                                    width: "50px",
                                    height: "75px",
                                    objectFit: "cover",
                                }}
                            />
                            <div>
                                <div style={{ fontWeight: "bold" }}>
                                    {movie.Title} ({movie.Year})
                                </div>
                            </div>
                        </div>
                    );
                })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;

