from django.db import models


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


class Order(models.Model):
    PAYMENT_MODE_CHOICES = [
        ('cod', 'Cash on Delivery'),
        ('upi', 'UPI'),
        ('card', 'Card'),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODE_CHOICES, default='cod')
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default='pending')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

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
