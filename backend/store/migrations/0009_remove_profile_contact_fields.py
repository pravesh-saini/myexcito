from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0008_userprofile'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='userprofile',
            name='phone',
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='address_line1',
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='address_line2',
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='city',
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='state',
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='postal_code',
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='country',
        ),
    ]
