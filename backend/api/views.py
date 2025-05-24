from django.shortcuts import render, get_object_or_404
from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from .serializers import UserSerializer, NoteSerializer, UserProfileSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
import requests
from .models import Note, UserProfile
import os

class NoteListCreate(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(parent=None).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

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

# Create your views here.
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
    def get(self, request):
        query = request.GET.get('query', '')
        api_key = '1e75925c'  # Consider moving this to environment variables
        
        response = requests.get(f'http://www.omdbapi.com/?t={query}&apikey={api_key}')
        return Response(response.json())

class SpotifyTokenView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            # Get Spotify credentials from environment variables
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

            # Get Spotify credentials and token
            client_id = os.getenv('SPOTIFY_CLIENT_ID')
            client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')

            if not client_id or not client_secret:
                return Response(
                    {'error': 'Spotify credentials not configured'}, 
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

            # Get access token
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

            # Search Spotify
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