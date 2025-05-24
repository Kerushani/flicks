from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Note, UserProfile, WatchlistItem

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['avatar', 'bio']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "profile"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user)
        return user

class NoteSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    time_ago = serializers.CharField(source='time_since_created', read_only=True)
    replies = serializers.SerializerMethodField()
    reply_count = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = ["id", "title", "content", "created_at", "updated_at", "author",
                 "author_username", "author_id", "author_avatar", "time_ago",
                 "edited", "replies", "reply_count", "parent"]
        extra_kwargs = {"author": {"read_only": True}}

    def get_replies(self, obj):
        if obj.parent is None:  # Only get replies for parent notes
            replies = obj.replies.all()
            return NoteReplySerializer(replies, many=True).data
        return []

    def get_reply_count(self, obj):
        if obj.parent is None:
            return obj.replies.count()
        return 0

    def get_author_avatar(self, obj):
        try:
            return obj.author.profile.avatar
        except UserProfile.DoesNotExist:
            return f'https://api.dicebear.com/7.x/initials/svg?seed={obj.author.username}&backgroundColor=9370DB'

class NoteReplySerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_avatar = serializers.SerializerMethodField()
    time_ago = serializers.CharField(source='time_since_created', read_only=True)

    class Meta:
        model = Note
        fields = ["id", "content", "created_at", "updated_at", "author_username",
                 "author_avatar", "time_ago", "edited"]

    def get_author_avatar(self, obj):
        try:
            return obj.author.profile.avatar
        except UserProfile.DoesNotExist:
            return f'https://api.dicebear.com/7.x/initials/svg?seed={obj.author.username}&backgroundColor=9370DB'

class WatchlistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = WatchlistItem
        fields = ['id', 'imdb_id', 'title', 'year', 'poster', 'added_at', 'watched', 'rating', 'notes', 'imdb_rating']
        read_only_fields = ['added_at']