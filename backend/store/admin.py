from django.contrib import admin
from .models import Product, Order, OrderItem


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'brand', 'price', 'on_sale', 'is_new')
    list_filter = ('category', 'brand', 'on_sale', 'is_new')
    search_fields = ('name', 'brand', 'description')


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'first_name', 'last_name', 'payment_mode', 'created_at', 'status', 'total_amount')
    list_filter = ('status', 'payment_mode', 'created_at')
    search_fields = ('email', 'first_name', 'last_name')
    inlines = [OrderItemInline]
