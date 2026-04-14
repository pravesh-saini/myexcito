from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0006_emailotp'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='coupon_code',
            field=models.CharField(blank=True, max_length=40),
        ),
        migrations.AddField(
            model_name='order',
            name='discount_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='order',
            name='shipping_fee',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='order',
            name='subtotal_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.CreateModel(
            name='ShippingSetting',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('flat_shipping_fee', models.DecimalField(decimal_places=2, default=79, max_digits=10)),
                ('free_shipping_threshold', models.DecimalField(decimal_places=2, default=999, max_digits=10)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
