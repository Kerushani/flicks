from django.db import migrations

def update_avatars(apps, schema_editor):
    UserProfile = apps.get_model('api', 'UserProfile')
    for profile in UserProfile.objects.all():
        profile.avatar = f'https://api.dicebear.com/7.x/bottts/svg?seed={profile.user.username}'
        profile.save()

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0003_alter_userprofile_avatar'),
    ]

    operations = [
        migrations.RunPython(update_avatars),
    ] 