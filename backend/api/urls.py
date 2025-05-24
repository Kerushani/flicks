from django.urls import path
from . import views

urlpatterns = [
    path("notes/", views.NoteListCreate.as_view(), name="note-list"),
    path("notes/<int:pk>/", views.NoteDetail.as_view(), name="note-detail"),
    path("notes/delete/<int:pk>/", views.NoteDelete.as_view(), name="note-delete"),
    path("users/create/", views.CreateUserView.as_view(), name="create-user"),
    path("profile/", views.UserProfileView.as_view(), name="user-profile"),
    path("search-movie/", views.SearchOMDbView.as_view(), name="search-movies"),
    path("spotify/token/", views.SpotifyTokenView.as_view(), name="spotify-token"),
    path("spotify/search/", views.SpotifySearchView.as_view(), name="spotify-search"),
]