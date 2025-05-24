from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import UserProfile, WatchlistItem, Note
from .serializers import UserSerializer, WatchlistItemSerializer, NoteSerializer

class APITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        self.watchlist_item = WatchlistItem.objects.create(
            user=self.user,
            imdb_id='tt0111161',
            title='The Shawshank Redemption',
            year='1994',
            poster='https://example.com/poster.jpg',
            imdb_rating='9.3'
        )
        
        self.note = Note.objects.create(
            title='Test Note',
            content='Test Content',
            author=self.user
        )

    def test_user_profile(self):
        """Test user profile endpoint"""
        response = self.client.get(reverse('user-profile'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')

    def test_watchlist_crud(self):
        """Test watchlist CRUD operations"""
        response = self.client.get(reverse('watchlist'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        new_item = {
            'imdb_id': 'tt0068646',
            'title': 'The Godfather',
            'year': '1972',
            'poster': 'https://example.com/godfather.jpg',
            'imdb_rating': '9.2'
        }
        response = self.client.post(reverse('watchlist'), new_item, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        update_data = {'watched': True, 'rating': 5}
        response = self.client.put(
            reverse('watchlist-detail', args=[self.watchlist_item.id]),
            update_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['watched'], True)
        self.assertEqual(response.data['rating'], 5)
        
        response = self.client.delete(reverse('watchlist-detail', args=[self.watchlist_item.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_notes_crud(self):
        """Test notes CRUD operations"""
        response = self.client.get(reverse('note-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        new_note = {
            'title': 'New Note',
            'content': 'New Content',
            'author': self.user.id
        }
        response = self.client.post(reverse('note-list'), new_note, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        update_data = {
            'title': 'Updated Note',
            'content': 'Updated Content',
            'author': self.user.id
        }
        response = self.client.put(
            reverse('note-detail', args=[self.note.id]),
            update_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['content'], 'Updated Content')
        self.assertEqual(response.data['title'], 'Updated Note')
        
        response = self.client.delete(reverse('note-detail', args=[self.note.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_search_movies(self):
        """Test movie search endpoint"""
        response = self.client.get(reverse('search-movies'), {'q': 'Inception'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('Search', response.data)

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        unauthorized_client = APIClient()
        
        response = unauthorized_client.get(reverse('watchlist'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        response = unauthorized_client.get(reverse('note-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        response = unauthorized_client.get(reverse('user-profile'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
