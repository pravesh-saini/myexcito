from django.urls import path
from . import views, admin_views

urlpatterns = [
    # API routes
    path('products/', views.ProductList.as_view(), name='product-list'),
    path('products/<int:pk>/', views.ProductDetail.as_view(), name='product-detail'),
    path('orders/', views.OrderCreate.as_view(), name='order-create'),
    path('orders/<int:pk>/', views.OrderDetail.as_view(), name='order-detail'),
]

# Custom Admin panel routes (under /admin/)
admin_panel_urls = [
    path('admin/login/', admin_views.custom_admin_login, name='custom_admin_login'),
    path('admin/logout/', admin_views.custom_admin_logout, name='custom_admin_logout'),
    path('admin/', admin_views.custom_admin_dashboard, name='custom_admin_dashboard'),
    path('admin/products/', admin_views.admin_products, name='admin_products'),
    path('admin/products/seed/', admin_views.admin_products_seed, name='admin_products_seed'),
    path('admin/products/add/', admin_views.admin_product_add, name='admin_product_add'),
    path('admin/products/<int:pk>/edit/', admin_views.admin_product_edit, name='admin_product_edit'),
    path('admin/products/<int:pk>/delete/', admin_views.admin_product_delete, name='admin_product_delete'),
    path('admin/orders/', admin_views.admin_orders, name='admin_orders'),
    path('admin/orders/<int:pk>/', admin_views.admin_order_detail, name='admin_order_detail'),
]
