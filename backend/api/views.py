from django.shortcuts import render, get_object_or_404
from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from .serializers import UserSerializer, NoteSerializer, UserProfileSerializer, WatchlistItemSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
import requests
from .models import Note, UserProfile, WatchlistItem
import os

class NoteListCreate(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        movie_imdb_id = self.request.query_params.get('movie_imdb_id', None)
        if movie_imdb_id:
            return Note.objects.filter(
                parent=None,
                movie_imdb_id=movie_imdb_id
            ).order_by('-created_at')
        return Note.objects.filter(parent=None).order_by('-created_at')

    def perform_create(self, serializer):
        movie_imdb_id = self.request.data.get('movie_imdb_id')
        movie_title = self.request.data.get('movie_title')
        serializer.save(
            author=self.request.user,
            movie_imdb_id=movie_imdb_id,
            movie_title=movie_title
        )

class NoteDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(author=self.request.user)

class NoteDelete(generics.DestroyAPIView):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(author=self.request.user)

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        profile = request.user.profile
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SearchOMDbView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        query = request.GET.get('q', '').strip()
        if not query:
            return Response(
                {'Search': []}, 
                status=status.HTTP_200_OK
            )
            
        api_key = '1e75925c'
        try:
            # First get search results
            search_response = requests.get(
                'http://www.omdbapi.com/',
                params={
                    's': query,
                    'apikey': api_key,
                    'type': 'movie',
                },
                timeout=5
            )
            search_response.raise_for_status()
            search_data = search_response.json()
            
            if search_data.get('Response') == 'False':
                return Response(
                    {'Search': []},
                    status=status.HTTP_200_OK
                )
            
            # Get detailed info for first 10 movies
            detailed_results = []
            if 'Search' in search_data:
                for movie in search_data['Search'][:10]:  # Limit to first 10 results
                    # Get additional movie details including rating
                    detail_response = requests.get(
                        'http://www.omdbapi.com/',
                        params={
                            'i': movie['imdbID'],
                            'apikey': api_key,
                        },
                        timeout=5
                    )
                    if detail_response.status_code == 200:
                        detail_data = detail_response.json()
                        # Only include movies with posters and required fields
                        if (detail_data.get('Poster', 'N/A') != 'N/A' and 
                            detail_data.get('Title') and 
                            detail_data.get('Year')):
                            detailed_results.append({
                                'imdbID': detail_data['imdbID'],
                                'Title': detail_data['Title'],
                                'Year': detail_data['Year'],
                                'Poster': detail_data['Poster'],
                                'imdbRating': detail_data.get('imdbRating', 'N/A')
                            })
                            if len(detailed_results) >= 10:  # Ensure we never exceed 10 results
                                break
                
            return Response({'Search': detailed_results})
            
        except requests.Timeout:
            return Response(
                {'error': 'Search request timed out. Please try again.'},
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
        except requests.RequestException as e:
            return Response(
                {'error': f'Failed to fetch movies: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SpotifyTokenView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            client_id = os.getenv('SPOTIFY_CLIENT_ID')
            client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')

            print("Spotify credentials check:", {
                'client_id_exists': bool(client_id),
                'client_secret_exists': bool(client_secret)
            })

            if not client_id or not client_secret:
                return Response(
                    {'error': 'Spotify credentials not configured'}, 
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

            # Get access token from Spotify
            auth_response = requests.post(
                'https://accounts.spotify.com/api/token',
                data={
                    'grant_type': 'client_credentials'
                },
                auth=(client_id, client_secret)
            )

            print("Spotify auth response:", {
                'status_code': auth_response.status_code,
                'content': auth_response.text
            })

            if auth_response.status_code != 200:
                error_details = auth_response.json() if auth_response.text else 'No error details available'
                return Response(
                    {
                        'error': 'Failed to authenticate with Spotify',
                        'details': error_details
                    }, 
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

            return Response(auth_response.json())
        except Exception as e:
            print("Spotify token error:", str(e))
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SpotifySearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            query = request.GET.get('q', '')
            if not query:
                return Response(
                    {'error': 'Search query is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            client_id = os.getenv('SPOTIFY_CLIENT_ID')
            client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')

            if not client_id or not client_secret:
                return Response(
                    {'error': 'Spotify credentials not configured'}, 
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

            auth_response = requests.post(
                'https://accounts.spotify.com/api/token',
                data={
                    'grant_type': 'client_credentials'
                },
                auth=(client_id, client_secret)
            )

            if auth_response.status_code != 200:
                return Response(
                    {'error': 'Failed to authenticate with Spotify'}, 
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

            access_token = auth_response.json()['access_token']

            search_response = requests.get(
                'https://api.spotify.com/v1/search',
                params={
                    'q': query,
                    'type': 'playlist',
                    'limit': 5
                },
                headers={
                    'Authorization': f'Bearer {access_token}'
                }
            )

            if search_response.status_code != 200:
                return Response(
                    {'error': 'Failed to search Spotify'}, 
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

            return Response(search_response.json())
        except Exception as e:
            print("Spotify search error:", str(e))
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class WatchlistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        watchlist = WatchlistItem.objects.filter(user=request.user)
        serializer = WatchlistItemSerializer(watchlist, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Add imdb_id validation
        existing = WatchlistItem.objects.filter(
            user=request.user, 
            imdb_id=request.data.get('imdb_id')
        ).first()
        
        if existing:
            return Response(
                {'error': 'Movie already in watchlist'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = WatchlistItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class WatchlistItemDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        return get_object_or_404(WatchlistItem, pk=pk, user=user)

    def put(self, request, pk):
        watchlist_item = self.get_object(pk, request.user)
        serializer = WatchlistItemSerializer(watchlist_item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        watchlist_item = self.get_object(pk, request.user)
        watchlist_item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)