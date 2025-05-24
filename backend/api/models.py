from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# Create your models here.
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.URLField(default='https://api.dicebear.com/7.x/initials/svg')  # Default avatar URL
    bio = models.TextField(max_length=500, blank=True)

    def __str__(self):
        return f"{self.user.username}'s profile"

    def save(self, *args, **kwargs):
        if not self.avatar:
            # Generate unique avatar URL using username and initials style
            self.avatar = f'https://api.dicebear.com/7.x/initials/svg?seed={self.user.username}&backgroundColor=9370DB'
        super().save(*args, **kwargs)

class WatchlistItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watchlist')
    imdb_id = models.CharField(max_length=20)
    title = models.CharField(max_length=200)
    year = models.CharField(max_length=4)
    poster = models.URLField(max_length=500)
    added_at = models.DateTimeField(auto_now_add=True)
    watched = models.BooleanField(default=False)
    rating = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    imdb_rating = models.CharField(max_length=4, blank=True, null=True)

    class Meta:
        ordering = ['-added_at']
        unique_together = ['user', 'imdb_id']

    def __str__(self):
        return f"{self.title} ({self.year}) - {self.user.username}'s list"

class Note(models.Model):
    title = models.CharField(max_length=100)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    edited = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.pk:  # If the note already exists
            self.edited = True
        super().save(*args, **kwargs)

    @property
    def is_reply(self):
        return self.parent is not None

    @property
    def time_since_created(self):
        now = timezone.now()
        diff = now - self.created_at

        if diff.days > 365:
            years = diff.days // 365
            return f"{years}y ago"
        elif diff.days > 30:
            months = diff.days // 30
            return f"{months}mo ago"
        elif diff.days > 0:
            return f"{diff.days}d ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours}h ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes}m ago"
        else:
            return "just now"