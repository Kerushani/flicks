import React, { useState, useEffect } from 'react';
import api from '../api';
import '../style/SoundtrackWidget.css';

const SoundtrackWidget = ({ movieTitle }) => {
    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const searchSoundtracks = async () => {
            if (!movieTitle) {
                console.log('No movie title provided');
                setLoading(false);
                return;
            }

            try {
                console.log('Searching for soundtracks:', movieTitle);
                setLoading(true);
                const searchQuery = `${movieTitle} soundtrack`;
                const response = await api.get("/api/spotify/search/", {
                    params: { q: searchQuery }
                });

                console.log('Spotify search response:', response.data);
                
                if (response.data.error) {
                    throw new Error(response.data.error);
                }

                // Get the most relevant playlist
                const validPlaylists = response.data.playlists?.items?.filter(playlist => 
                    playlist && 
                    playlist.id && 
                    playlist.name
                ) || [];

                setPlaylist(validPlaylists[0] || null);
                setLoading(false);
            } catch (err) {
                console.error('Spotify search error:', err);
                setError(err.response?.data?.error || err.message || 'Failed to fetch soundtracks');
                setLoading(false);
            }
        };

        searchSoundtracks();
    }, [movieTitle]);

    if (loading) {
        return <p className="loading-details">Loading soundtrack...</p>;
    }

    if (error) {
        return <p className="error-message">{error}</p>;
    }

    if (!playlist) {
        return null;
    }

    return (
        <iframe
            src={`https://open.spotify.com/embed/playlist/${playlist.id}`}
            width="100%"
            height="380"
            frameBorder="0"
            allowtransparency="true"
            allow="encrypted-media"
            title={`${playlist.name} player`}
            className="spotify-player"
        />
    );
};

export default SoundtrackWidget; 