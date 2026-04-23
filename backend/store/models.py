from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver


CATEGORY_CHOICES = [
    ('men', 'Men'),
    ('women', 'Women'),
    ('kids', 'Kids'),
    ('sale', 'Sale'),
]


class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='products/')
    color_images = models.JSONField(default=dict, blank=True)  # map of normalized color -> image path
    price = models.DecimalField(max_digits=10, decimal_places=2)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    section = models.CharField(max_length=50, default='')
    brand = models.CharField(max_length=100, blank=True)
    colors = models.JSONField(default=list)  # list of color strings
    sizes = models.JSONField(default=list)   # list of size strings
    is_new = models.BooleanField(default=False)
    on_sale = models.BooleanField(default=False)
    is_limited_stock = models.BooleanField(default=False)
    stock_count = models.PositiveIntegerField(default=0)
    discount = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name='gallery_images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/gallery/')
    alt_text = models.CharField(max_length=255, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', 'id']

    def __str__(self):
        return f"{self.product.name} — Image #{self.display_order}"


class Order(models.Model):
    PAYMENT_MODE_CHOICES = [
        ('cod', 'Cash on Delivery'),
        ('upi', 'UPI'),
        ('card', 'Card'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('cod_pending', 'COD Pending'),
        ('stock_unavailable', 'Stock Unavailable'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='orders')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODE_CHOICES, default='cod')
    payment_status = models.CharField(max_length=30, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_reference = models.CharField(max_length=120, blank=True)
    idempotency_key = models.CharField(max_length=64, blank=True, default='')
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default='pending')
    subtotal_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    coupon_code = models.CharField(max_length=40, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'idempotency_key'],
                condition=models.Q(user__isnull=False) & models.Q(idempotency_key__gt=''),
                name='uniq_order_user_idempotency_key',
            ),
            models.UniqueConstraint(
                fields=['email', 'idempotency_key'],
                condition=models.Q(user__isnull=True) & models.Q(idempotency_key__gt=''),
                name='uniq_order_guest_idempotency_key',
            ),
        ]

    def __str__(self):
        return f"Order {self.id} - {self.email}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    size = models.CharField(max_length=20, blank=True)
    color = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"


class PaymentWebhookEvent(models.Model):
    event_id = models.CharField(max_length=120, unique=True)
    event_type = models.CharField(max_length=60)
    order = models.ForeignKey('Order', related_name='payment_events', null=True, blank=True, on_delete=models.SET_NULL)
    signature = models.CharField(max_length=128, blank=True)
    status = models.CharField(max_length=40, default='processed')
    payload = models.JSONField(default=dict, blank=True)
    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-received_at']

    def __str__(self):
        return f"{self.event_type} ({self.event_id})"


class StockHistory(models.Model):
    product = models.ForeignKey(Product, related_name='stock_logs', on_delete=models.CASCADE)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    old_stock = models.PositiveIntegerField()
    new_stock = models.PositiveIntegerField()
    reason = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.product.name}: {self.old_stock} -> {self.new_stock}"


class LoyaltyCoupon(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='loyalty_coupons', on_delete=models.CASCADE)
    code = models.CharField(max_length=40, unique=True)
    discount_percent = models.PositiveIntegerField(default=10)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.code} ({self.discount_percent}% off)"


class ShippingSetting(models.Model):
    flat_shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=79)
    free_shipping_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=999)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Shipping: fee={self.flat_shipping_fee}, free_over={self.free_shipping_threshold}"


class EmailOTP(models.Model):
    email = models.EmailField(db_index=True)
    otp_hash = models.CharField(max_length=255)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP for {self.email}"


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='profiles/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile: {self.user.username}"


User = get_user_model()


@receiver(post_save, sender=User)
def create_or_sync_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
        return

    # Ensure older users always have a profile row available.
    UserProfile.objects.get_or_create(user=instance)


def log_stock_change(product, old_stock, new_stock, changed_by=None, reason=''):
    if old_stock == new_stock:
        return
    StockHistory.objects.create(
        product=product,
        changed_by=changed_by,
        old_stock=old_stock,
        new_stock=new_stock,
        reason=reason,
    )

class WishlistItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='wishlist_items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}'s wishlist: {self.product.name}"
