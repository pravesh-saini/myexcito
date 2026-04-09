from rest_framework import serializers
from .models import Product, Order, OrderItem


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

    class Meta:
        model = Order
        fields = ('id', 'first_name', 'last_name', 'email', 'phone',
                  'payment_mode', 'address_line1', 'address_line2', 'city', 'state',
                  'postal_code', 'country', 'status', 'total_amount', 'items', 'created_at')
        read_only_fields = ('id', 'status', 'total_amount', 'created_at')

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        total = 0
        order = Order.objects.create(**validated_data)
        for item in items_data:
            product = item['product']
            quantity = item.get('quantity', 1)
            price = product.price
            total += price * quantity
            OrderItem.objects.create(order=order, price=price, **item)
        order.total_amount = total
        order.save()
        return order
