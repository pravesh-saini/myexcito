from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0011_paymentwebhookevent_order_idempotency_key_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='color_images',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
