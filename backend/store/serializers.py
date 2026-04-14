from rest_framework import serializers
from django.db import transaction
from django.contrib.auth import get_user_model
from decimal import Decimal, ROUND_HALF_UP
from .models import Product, Order, OrderItem, LoyaltyCoupon, ShippingSetting, log_stock_change


User = get_user_model()


class ProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return ''


class OrderItemSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ('product', 'price', 'quantity', 'size', 'color')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Order
        fields = ('id', 'user', 'first_name', 'last_name', 'email', 'phone',
                  'payment_mode', 'address_line1', 'address_line2', 'city', 'state',
                  'postal_code', 'country', 'status', 'subtotal_amount', 'shipping_fee',
                  'discount_amount', 'coupon_code', 'total_amount', 'items', 'created_at')
        read_only_fields = ('id', 'status', 'subtotal_amount', 'shipping_fee', 'discount_amount', 'total_amount', 'created_at')

    def validate_payment_mode(self, value):
        if not value:
            raise serializers.ValidationError('Please select a payment mode.')
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        coupon_code = (validated_data.get('coupon_code') or '').strip().upper()
        subtotal = Decimal('0.00')

        request = self.context.get('request')
        linked_user = None
        if request and getattr(request, 'user', None) and request.user.is_authenticated:
            linked_user = request.user
        else:
            linked_user = User.objects.filter(email__iexact=validated_data.get('email', '')).first()

        if linked_user:
            validated_data['user'] = linked_user

        with transaction.atomic():
            order = Order.objects.create(**validated_data)

            for item in items_data:
                product = Product.objects.select_for_update().get(pk=item['product'].pk)
                quantity = item.get('quantity', 1)

                if quantity < 1:
                    raise serializers.ValidationError({'items': 'Quantity must be at least 1.'})
                if product.stock_count < quantity:
                    raise serializers.ValidationError({
                        'items': f'Insufficient stock for "{product.name}". Available: {product.stock_count}.',
                    })

                old_stock = product.stock_count
                product.stock_count -= quantity
                product.is_limited_stock = 0 < product.stock_count <= 5
                product.save(update_fields=['stock_count', 'is_limited_stock'])

                price = product.price
                subtotal += Decimal(price) * Decimal(quantity)
                OrderItem.objects.create(order=order, product=product, price=price, quantity=quantity,
                                         size=item.get('size', ''), color=item.get('color', ''))

            shipping = ShippingSetting.objects.first()
            flat_fee = Decimal(str(shipping.flat_shipping_fee if shipping else Decimal('79.00')))
            free_threshold = Decimal(str(shipping.free_shipping_threshold if shipping else Decimal('999.00')))
            shipping_fee = Decimal('0.00') if subtotal >= free_threshold else flat_fee

            discount_amount = Decimal('0.00')
            if coupon_code:
                coupon = LoyaltyCoupon.objects.filter(code=coupon_code, is_active=True).select_related('user').first()
                if not coupon:
                    raise serializers.ValidationError({'coupon_code': 'Invalid or inactive coupon code.'})
                if coupon.expires_at and coupon.expires_at < order.created_at:
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

            for order_item in order.items.select_related('product').all():
                product = order_item.product
                log_stock_change(
                    product=product,
                    old_stock=product.stock_count + order_item.quantity,
                    new_stock=product.stock_count,
                    changed_by=None,
                    reason=f'Order #{order.id} placed',
                )
            return order
