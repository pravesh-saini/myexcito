from rest_framework import serializers
from django.conf import settings
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal, ROUND_HALF_UP
from .models import Product, ProductImage, Order, OrderItem, LoyaltyCoupon, ShippingSetting, log_stock_change, WishlistItem


User = get_user_model()


class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'image_url', 'alt_text', 'display_order')

    def get_image_url(self, obj):
        if not obj.image:
            return ''
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)
        return f"{settings.MEDIA_URL.rstrip('/')}/{obj.image.name.lstrip('/')}"


class ProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    color_image_urls = serializers.SerializerMethodField()
    gallery_image_urls = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id',
            'name',
            'description',
            'image',
            'image_url',
            'color_images',
            'color_image_urls',
            'gallery_image_urls',
            'price',
            'original_price',
            'category',
            'section',
            'brand',
            'colors',
            'sizes',
            'is_new',
            'on_sale',
            'is_limited_stock',
            'stock_count',
            'discount',
        )

    def get_image_url(self, obj):
        if not obj.image:
            return ''
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)
        return f"{settings.MEDIA_URL.rstrip('/')}/{obj.image.name.lstrip('/')}"

    def get_gallery_image_urls(self, obj):
        request = self.context.get('request')
        images = []
        for img in obj.gallery_images.all():
            if img.image:
                if request:
                    url = request.build_absolute_uri(img.image.url)
                else:
                    url = f"{settings.MEDIA_URL.rstrip('/')}/{img.image.name.lstrip('/')}"
                
                images.append({
                    'id': img.id,
                    'url': url,
                    'alt_text': img.alt_text,
                    'display_order': img.display_order,
                })
        return images

    def get_color_image_urls(self, obj):
        request = self.context.get('request')
        if not request:
            return obj.color_images or {}

        resolved = {}
        for color_key, raw_path in (obj.color_images or {}).items():
            path = str(raw_path or '').strip()
            if not path:
                continue

            if path.startswith('http://') or path.startswith('https://'):
                resolved[color_key] = path
                continue

            if path.startswith('/'):
                media_path = path
            elif path.startswith(settings.MEDIA_URL):
                media_path = path
            else:
                media_path = f"{settings.MEDIA_URL.rstrip('/')}/{path.lstrip('/')}"

            resolved[color_key] = request.build_absolute_uri(media_path)

        return resolved


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = WishlistItem
        fields = ('id', 'product', 'product_id', 'created_at')
        read_only_fields = ('id', 'created_at')




class OrderItemSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ('product', 'price', 'quantity', 'size', 'color')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    idempotency_key = serializers.CharField(max_length=64, write_only=True)
    payment_status = serializers.CharField(read_only=True)
    payment_reference = serializers.CharField(read_only=True)
    paid_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Order
        fields = ('id', 'user', 'first_name', 'last_name', 'email', 'phone',
                  'payment_mode', 'address_line1', 'address_line2', 'city', 'state',
                  'postal_code', 'country', 'status', 'payment_status', 'payment_reference',
                  'subtotal_amount', 'shipping_fee', 'discount_amount', 'coupon_code',
                  'total_amount', 'idempotency_key', 'paid_at', 'items', 'created_at')
        read_only_fields = (
            'id',
            'status',
            'payment_status',
            'payment_reference',
            'subtotal_amount',
            'shipping_fee',
            'discount_amount',
            'total_amount',
            'paid_at',
            'created_at',
        )

    def validate_payment_mode(self, value):
        if not value:
            raise serializers.ValidationError('Please select a payment mode.')
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        coupon_code = (validated_data.get('coupon_code') or '').strip().upper()
        validated_data['coupon_code'] = coupon_code
        validated_data['email'] = (validated_data.get('email') or '').strip().lower()
        subtotal = Decimal('0.00')

        request = self.context.get('request')
        linked_user = None
        if request and getattr(request, 'user', None) and request.user.is_authenticated:
            linked_user = request.user
        else:
            linked_user = User.objects.filter(email__iexact=validated_data.get('email', '')).first()

        if linked_user:
            validated_data['user'] = linked_user

        reserve_stock_now = validated_data.get('payment_mode') == 'cod'
        validated_data['payment_status'] = 'cod_pending' if reserve_stock_now else 'pending'

        with transaction.atomic():
            order = Order.objects.create(**validated_data)
            stock_logs = []

            for item in items_data:
                product = Product.objects.select_for_update().get(pk=item['product'].pk)
                quantity = item.get('quantity', 1)

                if quantity < 1:
                    raise serializers.ValidationError({'items': 'Quantity must be at least 1.'})
                if product.stock_count < quantity:
                    raise serializers.ValidationError({
                        'items': f'Insufficient stock for "{product.name}". Available: {product.stock_count}.',
                    })

                price = product.price
                subtotal += Decimal(price) * Decimal(quantity)
                OrderItem.objects.create(order=order, product=product, price=price, quantity=quantity,
                                         size=item.get('size', ''), color=item.get('color', ''))

                if reserve_stock_now:
                    old_stock = product.stock_count
                    product.stock_count -= quantity
                    product.is_limited_stock = 0 < product.stock_count <= 5
                    product.save(update_fields=['stock_count', 'is_limited_stock'])
                    stock_logs.append((product, old_stock, product.stock_count))

            shipping = ShippingSetting.objects.first()
            flat_fee = Decimal(str(shipping.flat_shipping_fee if shipping else Decimal('79.00')))
            free_threshold = Decimal(str(shipping.free_shipping_threshold if shipping else Decimal('999.00')))
            shipping_fee = Decimal('0.00') if subtotal >= free_threshold else flat_fee

            discount_amount = Decimal('0.00')
            if coupon_code:
                coupon = LoyaltyCoupon.objects.filter(code=coupon_code, is_active=True).select_related('user').first()
                if not coupon:
                    raise serializers.ValidationError({'coupon_code': 'Invalid or inactive coupon code.'})
                if coupon.expires_at and coupon.expires_at < timezone.now():
                    raise serializers.ValidationError({'coupon_code': 'Coupon is expired.'})
                if linked_user and coupon.user_id != linked_user.id:
                    raise serializers.ValidationError({'coupon_code': 'Coupon does not belong to this user.'})
                if not linked_user and coupon.user.email.lower() != validated_data.get('email', '').lower():
                    raise serializers.ValidationError({'coupon_code': 'Coupon does not belong to this email.'})

                discount_amount = (subtotal * Decimal(coupon.discount_percent) / Decimal('100')).quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP
                )
                coupon.is_active = False
                coupon.save(update_fields=['is_active'])

            total = subtotal + shipping_fee - discount_amount
            if total < 0:
                total = Decimal('0.00')

            order.subtotal_amount = subtotal
            order.shipping_fee = shipping_fee
            order.discount_amount = discount_amount
            order.coupon_code = coupon_code
            order.total_amount = total
            order.save(update_fields=['subtotal_amount', 'shipping_fee', 'discount_amount', 'coupon_code', 'total_amount'])

            for product, old_stock, new_stock in stock_logs:
                log_stock_change(
                    product=product,
                    old_stock=old_stock,
                    new_stock=new_stock,
                    changed_by=None,
                    reason=f'Order #{order.id} placed',
                )
            return order
