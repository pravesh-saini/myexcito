from django.urls import path
from . import views, admin_views

urlpatterns = [
    # API routes
    path('products/', views.ProductList.as_view(), name='product-list'),
    path('products/<int:pk>/', views.ProductDetail.as_view(), name='product-detail'),
    path('orders/', views.OrderCreate.as_view(), name='order-create'),
    path('orders/<int:pk>/', views.OrderDetail.as_view(), name='order-detail'),
    path('auth/request-otp/', views.RequestEmailOTP.as_view(), name='auth-request-otp'),
    path('auth/verify-otp/', views.VerifyEmailOTP.as_view(), name='auth-verify-otp'),
    path('auth/signup/', views.SignupWithPassword.as_view(), name='auth-signup'),
    path('auth/login-password/', views.LoginWithPassword.as_view(), name='auth-login-password'),
    path('shipping/config/', views.ShippingConfigView.as_view(), name='shipping-config'),
    path('coupons/validate/', views.ValidateCouponView.as_view(), name='coupon-validate'),
]

# Custom Admin panel routes (under /admin/)
admin_panel_urls = [
    path('admin/login/', admin_views.custom_admin_login, name='custom_admin_login'),
    path('admin/logout/', admin_views.custom_admin_logout, name='custom_admin_logout'),
    path('admin/', admin_views.custom_admin_dashboard, name='custom_admin_dashboard'),
    path('admin/coupons/create/', admin_views.admin_create_loyalty_coupon, name='admin_create_loyalty_coupon'),
    path('admin/products/', admin_views.admin_products, name='admin_products'),
    path('admin/products/seed/', admin_views.admin_products_seed, name='admin_products_seed'),
    path('admin/products/add/', admin_views.admin_product_add, name='admin_product_add'),
    path('admin/products/<int:pk>/edit/', admin_views.admin_product_edit, name='admin_product_edit'),
    path('admin/products/<int:pk>/delete/', admin_views.admin_product_delete, name='admin_product_delete'),
    path('admin/stock/', admin_views.admin_stock, name='admin_stock'),
    path('admin/stock/history/', admin_views.admin_stock_history, name='admin_stock_history'),
    path('admin/orders/', admin_views.admin_orders, name='admin_orders'),
    path('admin/orders/placed/', admin_views.admin_orders_placed, name='admin_orders_placed'),
    path('admin/orders/cancelled/', admin_views.admin_orders_cancelled, name='admin_orders_cancelled'),
    path('admin/orders/<int:pk>/', admin_views.admin_order_detail, name='admin_order_detail'),
    path('admin/payments/', admin_views.admin_payments, name='admin_payments'),
    path('admin/shipping-settings/', admin_views.admin_shipping_settings, name='admin_shipping_settings'),
    path('admin/users/', admin_views.admin_users, name='admin_users'),
    path('admin/users/add/', admin_views.admin_user_add, name='admin_user_add'),
    path('admin/users/<int:pk>/view/', admin_views.admin_user_view, name='admin_user_view'),
    path('admin/users/<int:pk>/edit/', admin_views.admin_user_edit, name='admin_user_edit'),
    path('admin/users/<int:pk>/password/temp/', admin_views.admin_user_generate_temp_password, name='admin_user_generate_temp_password'),
    path('admin/users/<int:pk>/coupon/create/', admin_views.admin_user_create_coupon, name='admin_user_create_coupon'),
    path('admin/users/<int:pk>/delete/', admin_views.admin_user_delete, name='admin_user_delete'),
]
