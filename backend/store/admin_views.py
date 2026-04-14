from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import user_passes_test
from django.contrib import messages
from django.db import transaction
from django.db.models import Sum, Count, Q
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.core.files.base import ContentFile
from datetime import timedelta
from decimal import Decimal
from io import BytesIO
from PIL import Image, ImageDraw
import json
import random
import string
from .models import Product, Order, OrderItem, StockHistory, LoyaltyCoupon, ShippingSetting, UserProfile, log_stock_change

User = get_user_model()


DEFAULT_SECTION_OPTIONS = [
    'shirts',
    'tops',
    'bottoms',
    'shorts',
    'pants',
    'shoes',
    'outerwear',
    'accessories',
    'sets',
]


def _loyalty_status(order_count, total_spend):
    spend = Decimal(total_spend or 0)
    if order_count >= 15 or spend >= Decimal('30000'):
        return 'Platinum', 20
    if order_count >= 8 or spend >= Decimal('15000'):
        return 'Gold', 15
    if order_count >= 4 or spend >= Decimal('7000'):
        return 'Silver', 10
    return 'Bronze', 5


def _generate_coupon_code(username):
    prefix = ''.join(ch for ch in (username or '').upper() if ch.isalnum())[:6] or 'USER'
    alphabet = string.ascii_uppercase + string.digits
    for _ in range(10):
        suffix = ''.join(random.choices(alphabet, k=6))
        code = f'{prefix}-{suffix}'
        if not LoyaltyCoupon.objects.filter(code=code).exists():
            return code
    return f'EXCITO-{"".join(random.choices(alphabet, k=10))}'


def _generate_temporary_password(length=12):
    alphabet = string.ascii_letters + string.digits + '@#$%&*'
    secure_random = random.SystemRandom()
    return ''.join(secure_random.choice(alphabet) for _ in range(length))


def _parse_discount_percent(raw_value):
    try:
        value = int(str(raw_value or '').strip())
    except (TypeError, ValueError):
        return None
    if value < 1 or value > 90:
        return None
    return value


def _placeholder_product_image(name: str) -> ContentFile:
    img = Image.new('RGB', (700, 850), (241, 245, 249))
    draw = ImageDraw.Draw(img)
    draw.rectangle((70, 70, 630, 780), fill=(229, 231, 235), outline=(203, 213, 225), width=4)
    initials = ''.join(word[0] for word in name.split()[:2]).upper() or 'PR'
    draw.text((315, 410), initials, fill=(55, 65, 81), anchor='mm')
    draw.text((350, 735), 'EXCITO', fill=(100, 116, 139), anchor='mm')

    buf = BytesIO()
    img.save(buf, format='PNG')
    return ContentFile(buf.getvalue())


def admin_login_required(view_func):
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated or not request.user.is_staff:
            return redirect('custom_admin_login')
        return view_func(request, *args, **kwargs)
    wrapper.__name__ = view_func.__name__
    return wrapper


def custom_admin_login(request):
    if request.user.is_authenticated and request.user.is_staff:
        return redirect('custom_admin_dashboard')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user and user.is_staff:
            login(request, user)
            return redirect('custom_admin_dashboard')
        else:
            messages.error(request, 'Invalid credentials or insufficient permissions.')
    
    return render(request, 'admin_panel/login.html')


def custom_admin_logout(request):
    logout(request)
    return redirect('custom_admin_login')


@admin_login_required
def custom_admin_dashboard(request):
    total_users = User.objects.count()
    total_customers = User.objects.filter(is_staff=False).count()
    total_orders = Order.objects.count()
    pending_orders = Order.objects.filter(status='pending').count()
    sold_orders = Order.objects.filter(status='delivered').count()
    returned_orders = Order.objects.filter(status='returned').count()
    total_products = Product.objects.count()
    total_revenue = Order.objects.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    sold_units = OrderItem.objects.filter(order__status='delivered').aggregate(total=Sum('quantity'))['total'] or 0
    returned_units = OrderItem.objects.filter(order__status='returned').aggregate(total=Sum('quantity'))['total'] or 0
    stock_remaining = Product.objects.aggregate(total=Sum('stock_count'))['total'] or 0
    low_stock_products = Product.objects.filter(stock_count__gt=0, stock_count__lte=5).count()
    out_of_stock_products = Product.objects.filter(stock_count=0).count()
    recent_orders = Order.objects.order_by('-created_at')[:8]
    # Backfill old guest orders to linked users by matching email.
    unmatched_orders = Order.objects.filter(user__isnull=True).exclude(email='')
    user_by_email = {
        u.email.lower(): u.id
        for u in User.objects.exclude(email='').only('id', 'email')
    }
    for order in unmatched_orders.only('id', 'email'):
        matched_user_id = user_by_email.get(order.email.lower())
        if matched_user_id:
            Order.objects.filter(pk=order.pk).update(user_id=matched_user_id)

    top_shoppers_qs = (
        Order.objects.values('user__id', 'user__username', 'user__email', 'email', 'first_name', 'last_name')
        .annotate(order_count=Count('id'), total_spend=Sum('total_amount'))
        .order_by('-order_count', '-total_spend')[:5]
    )
    top_shopper_ids = [row['user__id'] for row in top_shoppers_qs if row['user__id']]
    active_coupon_map = {
        coupon.user_id: coupon
        for coupon in LoyaltyCoupon.objects.filter(user_id__in=top_shopper_ids, is_active=True)
    }

    user_insights_qs = (
        User.objects.filter(is_staff=False)
        .annotate(order_count=Count('orders'), total_spend=Sum('orders__total_amount'))
        .order_by('-order_count', '-total_spend', '-date_joined')[:12]
    )
    insight_user_ids = [u.id for u in user_insights_qs]
    insight_coupon_map = {
        coupon.user_id: coupon
        for coupon in LoyaltyCoupon.objects.filter(user_id__in=insight_user_ids, is_active=True)
    }
    users_with_orders = sum(1 for u in user_insights_qs if (u.order_count or 0) > 0)

    user_insights = []
    for user in user_insights_qs:
        order_count = user.order_count or 0
        total_spend = user.total_spend or 0
        status, suggested_discount = _loyalty_status(order_count, total_spend)
        active_coupon = insight_coupon_map.get(user.id)
        user_insights.append(
            {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'order_count': order_count,
                'total_spend': total_spend,
                'loyalty_status': status,
                'suggested_discount': suggested_discount,
                'active_coupon_code': active_coupon.code if active_coupon else '',
            }
        )

    top_shoppers = []
    for shopper in top_shoppers_qs:
        status, suggested_discount = _loyalty_status(shopper['order_count'], shopper['total_spend'])
        active_coupon = active_coupon_map.get(shopper['user__id'])
        display_name = shopper['user__username']
        if not display_name:
            display_name = f"{(shopper.get('first_name') or '').strip()} {(shopper.get('last_name') or '').strip()}".strip()
        if not display_name:
            display_name = (shopper.get('email') or 'Guest').split('@')[0]

        top_shoppers.append(
            {
                **shopper,
                'display_name': display_name,
                'display_email': shopper['user__email'] or shopper.get('email') or '-',
                'loyalty_status': status,
                'suggested_discount': suggested_discount,
                'active_coupon_code': active_coupon.code if active_coupon else '',
            }
        )
    
    category_stats = Product.objects.values('category').annotate(count=Count('id'))
    
    context = {
        'total_users': total_users,
        'total_customers': total_customers,
        'users_with_orders': users_with_orders,
        'total_orders': total_orders,
        'pending_orders': pending_orders,
        'sold_orders': sold_orders,
        'returned_orders': returned_orders,
        'total_products': total_products,
        'total_revenue': total_revenue,
        'sold_units': sold_units,
        'returned_units': returned_units,
        'stock_remaining': stock_remaining,
        'low_stock_products': low_stock_products,
        'out_of_stock_products': out_of_stock_products,
        'recent_orders': recent_orders,
        'top_shoppers': top_shoppers,
        'user_insights': user_insights,
        'category_stats': list(category_stats),
    }
    return render(request, 'admin_panel/dashboard.html', context)


@admin_login_required
@require_POST
def admin_create_loyalty_coupon(request):
    user_id = request.POST.get('user_id')
    if not user_id:
        messages.error(request, 'User not found for coupon creation.')
        return redirect('custom_admin_dashboard')

    discount_percent = _parse_discount_percent(request.POST.get('discount_percent'))
    if discount_percent is None:
        messages.error(request, 'Enter a valid discount percent between 1 and 90.')
        return redirect('custom_admin_dashboard')

    shopper = (
        Order.objects.filter(user_id=user_id)
        .values('user__id', 'user__username', 'user__email')
        .annotate(order_count=Count('id'), total_spend=Sum('total_amount'))
        .order_by('user__id')
        .first()
    )
    if not shopper:
        messages.error(request, 'No order data found for this user.')
        return redirect('custom_admin_dashboard')

    if LoyaltyCoupon.objects.filter(user_id=user_id, is_active=True).exists():
        active_coupon = LoyaltyCoupon.objects.filter(user_id=user_id, is_active=True).first()
        messages.info(request, f'Active coupon already exists: {active_coupon.code}')
        return redirect('custom_admin_dashboard')

    code = _generate_coupon_code(shopper['user__username'])

    LoyaltyCoupon.objects.create(
        user_id=user_id,
        code=code,
        discount_percent=discount_percent,
        expires_at=timezone.now() + timedelta(days=30),
    )

    messages.success(
        request,
        f'Coupon {code} ({discount_percent}% off) created for {shopper["user__username"]}.',
    )
    return redirect('custom_admin_dashboard')


@admin_login_required
def admin_shipping_settings(request):
    shipping = ShippingSetting.objects.first()
    if not shipping:
        shipping = ShippingSetting.objects.create()

    if request.method == 'POST':
        try:
            flat_fee = request.POST.get('flat_shipping_fee', '').strip()
            free_threshold = request.POST.get('free_shipping_threshold', '').strip()
            shipping.flat_shipping_fee = flat_fee
            shipping.free_shipping_threshold = free_threshold
            shipping.save(update_fields=['flat_shipping_fee', 'free_shipping_threshold', 'updated_at'])
            messages.success(request, 'Shipping settings updated.')
        except Exception:
            messages.error(request, 'Invalid shipping values. Please check and try again.')
        return redirect('admin_shipping_settings')

    return render(request, 'admin_panel/shipping_settings.html', {'shipping': shipping})


def _build_user_management_context(user_obj):
    profile, _ = UserProfile.objects.get_or_create(user=user_obj)
    order_count = user_obj.orders.count()
    total_spend = user_obj.orders.aggregate(total=Sum('total_amount'))['total'] or 0
    loyalty_status, suggested_discount = _loyalty_status(order_count, total_spend)
    active_coupon = LoyaltyCoupon.objects.filter(user=user_obj, is_active=True).order_by('-created_at').first()
    recent_orders = user_obj.orders.order_by('-created_at')[:6]

    return {
        'user_obj': user_obj,
        'phone': profile.phone,
        'order_count': order_count,
        'total_spend': total_spend,
        'loyalty_status': loyalty_status,
        'suggested_discount': suggested_discount,
        'active_coupon': active_coupon,
        'recent_orders': recent_orders,
    }


@admin_login_required
def admin_users(request):
    search = request.GET.get('search', '').strip()
    no_password_only = request.GET.get('no_password', '').strip() == '1'

    users_qs = User.objects.all()
    if search:
        users_qs = users_qs.filter(
            Q(username__icontains=search)
            | Q(email__icontains=search)
            | Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
        )

    users_qs = users_qs.select_related('profile').annotate(
        order_count=Count('orders'),
        total_spend=Sum('orders__total_amount'),
    ).order_by('-order_count', '-total_spend', '-date_joined')

    if no_password_only:
        users_qs = users_qs.filter(password__startswith='!')

    user_ids = [u.id for u in users_qs]
    active_coupon_map = {
        coupon.user_id: coupon
        for coupon in LoyaltyCoupon.objects.filter(user_id__in=user_ids, is_active=True)
    }

    user_rows = []
    for user in users_qs:
        order_count = user.order_count or 0
        total_spend = user.total_spend or 0
        loyalty_status, suggested_discount = _loyalty_status(order_count, total_spend)
        full_name = f'{(user.first_name or "").strip()} {(user.last_name or "").strip()}'.strip()
        profile, _ = UserProfile.objects.get_or_create(user=user)
        user_rows.append(
            {
                'id': user.id,
                'username': user.username,
                'full_name': full_name,
                'email': user.email,
                'phone': profile.phone,
                'has_password': user.has_usable_password(),
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
                'order_count': order_count,
                'total_spend': total_spend,
                'loyalty_status': loyalty_status,
                'suggested_discount': suggested_discount,
                'active_coupon_code': active_coupon_map.get(user.id).code if active_coupon_map.get(user.id) else '',
            }
        )

    return render(
        request,
        'admin_panel/users.html',
        {
            'users': user_rows,
            'search': search,
            'no_password_only': no_password_only,
            'total_users': users_qs.count(),
        },
    )


@admin_login_required
def admin_user_add(request):
    if request.method == 'POST':
        username = (request.POST.get('username') or '').strip()
        first_name = (request.POST.get('first_name') or '').strip()
        last_name = (request.POST.get('last_name') or '').strip()
        email = (request.POST.get('email') or '').strip().lower()
        phone = (request.POST.get('phone') or '').strip()
        password = (request.POST.get('password') or '').strip()
        is_staff = request.POST.get('is_staff') == 'on'
        is_active = request.POST.get('is_active') == 'on'

        if not username:
            messages.error(request, 'Username is required.')
            return redirect('admin_user_add')
        if password and len(password) < 6:
            messages.error(request, 'Password must be at least 6 characters.')
            return redirect('admin_user_add')
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists.')
            return redirect('admin_user_add')
        if email and User.objects.filter(email__iexact=email).exists():
            messages.error(request, 'Email already exists.')
            return redirect('admin_user_add')

        user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_staff=is_staff,
            is_active=is_active,
        )
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
            user.is_active = False
        user.save()
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.phone = phone
        profile.save(update_fields=['phone', 'updated_at'])
        if password:
            messages.success(request, f'User "{username}" created successfully.')
        else:
            messages.success(request, f'User "{username}" created without password and cannot log in until password is set.')
        return redirect('admin_users')

    return render(request, 'admin_panel/user_form.html', {'action': 'Add', 'user_obj': None, 'phone': ''})


@admin_login_required
def admin_user_edit(request, pk):
    user_obj = get_object_or_404(User, pk=pk)
    profile, _ = UserProfile.objects.get_or_create(user=user_obj)

    if request.method == 'POST':
        username = (request.POST.get('username') or '').strip()
        first_name = (request.POST.get('first_name') or '').strip()
        last_name = (request.POST.get('last_name') or '').strip()
        email = (request.POST.get('email') or '').strip().lower()
        phone = (request.POST.get('phone') or '').strip()
        password = (request.POST.get('password') or '').strip()
        remove_password = request.POST.get('remove_password') == 'on'
        is_staff = request.POST.get('is_staff') == 'on'
        is_active = request.POST.get('is_active') == 'on'

        if not username:
            messages.error(request, 'Username is required.')
            return redirect('admin_user_edit', pk=pk)
        if User.objects.exclude(pk=pk).filter(username=username).exists():
            messages.error(request, 'Username already exists.')
            return redirect('admin_user_edit', pk=pk)
        if email and User.objects.exclude(pk=pk).filter(email__iexact=email).exists():
            messages.error(request, 'Email already exists.')
            return redirect('admin_user_edit', pk=pk)

        user_obj.username = username
        user_obj.first_name = first_name
        user_obj.last_name = last_name
        user_obj.email = email
        user_obj.is_staff = is_staff
        user_obj.is_active = is_active
        if remove_password:
            user_obj.set_unusable_password()
            user_obj.is_active = False
        if password:
            if len(password) < 6:
                messages.error(request, 'Password must be at least 6 characters.')
                return redirect('admin_user_edit', pk=pk)
            user_obj.set_password(password)
        user_obj.save()

        profile.phone = phone
        profile.save(update_fields=['phone', 'updated_at'])
        messages.success(request, f'User "{user_obj.username}" updated successfully.')
        return redirect('admin_user_edit', pk=pk)

    context = _build_user_management_context(user_obj)
    context['action'] = 'Edit'
    return render(request, 'admin_panel/user_form.html', context)


@admin_login_required
def admin_user_view(request, pk):
    user_obj = get_object_or_404(User, pk=pk)
    context = _build_user_management_context(user_obj)
    return render(request, 'admin_panel/user_detail.html', context)


@admin_login_required
@require_POST
def admin_user_generate_temp_password(request, pk):
    user_obj = get_object_or_404(User, pk=pk)
    temp_password = _generate_temporary_password()
    user_obj.set_password(temp_password)
    user_obj.is_active = True
    user_obj.save(update_fields=['password', 'is_active'])

    messages.success(
        request,
        f'Temporary password for {user_obj.username}: {temp_password}',
    )

    return_to = (request.POST.get('return_to') or 'edit').strip().lower()
    if return_to == 'view':
        return redirect('admin_user_view', pk=pk)
    return redirect('admin_user_edit', pk=pk)


@admin_login_required
@require_POST
def admin_user_create_coupon(request, pk):
    user_obj = get_object_or_404(User, pk=pk)
    if user_obj.is_staff:
        messages.info(request, 'Coupons are not applicable to staff accounts.')
        return redirect('admin_user_edit', pk=pk)

    order_summary = user_obj.orders.aggregate(order_count=Count('id'), total_spend=Sum('total_amount'))
    order_count = order_summary.get('order_count') or 0
    total_spend = order_summary.get('total_spend') or 0

    if order_count == 0:
        messages.info(request, 'User has no orders yet, coupon not created.')
        return redirect('admin_user_edit', pk=pk)

    discount_percent = _parse_discount_percent(request.POST.get('discount_percent'))
    if discount_percent is None:
        messages.error(request, 'Enter a valid discount percent between 1 and 90.')
        return redirect('admin_user_edit', pk=pk)

    existing_coupon = LoyaltyCoupon.objects.filter(user=user_obj, is_active=True).first()
    if existing_coupon:
        messages.info(request, f'Active coupon already exists: {existing_coupon.code}')
        return redirect('admin_user_edit', pk=pk)

    code = _generate_coupon_code(user_obj.username)
    LoyaltyCoupon.objects.create(
        user=user_obj,
        code=code,
        discount_percent=discount_percent,
        expires_at=timezone.now() + timedelta(days=30),
    )
    messages.success(request, f'Coupon {code} ({discount_percent}% off) created for {user_obj.username}.')
    return redirect('admin_user_edit', pk=pk)


@admin_login_required
@require_POST
def admin_user_delete(request, pk):
    user_obj = get_object_or_404(User, pk=pk)
    if user_obj.id == request.user.id:
        messages.error(request, 'You cannot delete your own account.')
        return redirect('admin_users')

    username = user_obj.username
    user_obj.delete()
    messages.success(request, f'User "{username}" deleted successfully.')
    return redirect('admin_users')


@admin_login_required
def admin_products(request):
    search = request.GET.get('search', '')
    category = request.GET.get('category', '')
    low_stock_filter = request.GET.get('low_stock', '') == '1'
    
    products = Product.objects.all()
    if search:
        products = products.filter(Q(name__icontains=search) | Q(brand__icontains=search))
    if category:
        products = products.filter(category=category)
    if low_stock_filter:
        products = products.filter(stock_count__gt=0, stock_count__lte=5)
    
    products = products.order_by('-id')
    return render(
        request,
        'admin_panel/products.html',
        {
            'products': products,
            'search': search,
            'category': category,
            'low_stock_filter': low_stock_filter,
        },
    )


@admin_login_required
@require_POST
def admin_products_seed(request):
    samples = [
        # Men
        {
            'name': 'Men Running Shoes',
            'category': 'men',
            'section': 'shoes',
            'brand': 'Excito',
            'price': '2499.00',
            'colors': ['black', 'white'],
            'sizes': ['7', '8', '9', '10'],
            'on_sale': False,
            'is_new': True,
            'stock_count': 25,
        },
        {
            'name': 'Men Training Shirt',
            'category': 'men',
            'section': 'shirts',
            'brand': 'Excito',
            'price': '999.00',
            'colors': ['navy', 'gray'],
            'sizes': ['S', 'M', 'L', 'XL'],
            'on_sale': False,
            'is_new': False,
            'stock_count': 40,
        },
        # Women
        {
            'name': 'Women Performance Shoes',
            'category': 'women',
            'section': 'shoes',
            'brand': 'Excito',
            'price': '2699.00',
            'colors': ['pink', 'white'],
            'sizes': ['5', '6', '7', '8'],
            'on_sale': False,
            'is_new': True,
            'stock_count': 20,
        },
        {
            'name': 'Women Active Top',
            'category': 'women',
            'section': 'tops',
            'brand': 'Excito',
            'price': '1199.00',
            'colors': ['black', 'purple'],
            'sizes': ['XS', 'S', 'M', 'L'],
            'on_sale': False,
            'is_new': False,
            'stock_count': 35,
        },
        # Kids
        {
            'name': 'Kids Sneakers',
            'category': 'kids',
            'section': 'shoes',
            'brand': 'Excito',
            'price': '1599.00',
            'colors': ['blue', 'red'],
            'sizes': ['1', '2', '3', '4', '5'],
            'on_sale': False,
            'is_new': True,
            'stock_count': 30,
        },
        {
            'name': 'Kids Sports Tee',
            'category': 'kids',
            'section': 'tops',
            'brand': 'Excito',
            'price': '699.00',
            'colors': ['green', 'white'],
            'sizes': ['2-3Y', '4-5Y', '6-7Y', '8-9Y'],
            'on_sale': False,
            'is_new': False,
            'stock_count': 50,
        },
        # Sale
        {
            'name': 'Sale Running Shoes',
            'category': 'sale',
            'section': 'shoes',
            'brand': 'Excito',
            'price': '1999.00',
            'original_price': '2499.00',
            'discount': 20,
            'colors': ['black', 'red'],
            'sizes': ['7', '8', '9', '10'],
            'on_sale': True,
            'is_new': False,
            'stock_count': 15,
        },
        {
            'name': 'Sale Bundle Set',
            'category': 'sale',
            'section': 'sets',
            'brand': 'Excito',
            'price': '1499.00',
            'original_price': '1999.00',
            'discount': 25,
            'colors': ['gray'],
            'sizes': ['S', 'M', 'L'],
            'on_sale': True,
            'is_new': False,
            'stock_count': 18,
        },
    ]

    created = 0
    for spec in samples:
        if Product.objects.filter(name=spec['name']).exists():
            continue

        safe_name = ''.join(ch.lower() if ch.isalnum() else '-' for ch in spec['name']).strip('-') or 'product'

        product = Product(
            name=spec['name'],
            description=spec.get('description', ''),
            price=spec['price'],
            original_price=spec.get('original_price') or None,
            category=spec['category'],
            section=spec.get('section', ''),
            brand=spec.get('brand', ''),
            colors=spec.get('colors', []),
            sizes=spec.get('sizes', []),
            is_new=spec.get('is_new', False),
            on_sale=spec.get('on_sale', False),
            is_limited_stock=spec.get('is_limited_stock', False),
            stock_count=spec.get('stock_count', 0),
            discount=spec.get('discount') or None,
        )
        product.image.save(f'{safe_name}.png', _placeholder_product_image(spec['name']), save=False)
        product.save()
        created += 1

    if created:
        messages.success(request, f'Added {created} sample products.')
    else:
        messages.info(request, 'Sample products already exist.')
    return redirect('admin_products')


@admin_login_required
def admin_product_add(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        description = request.POST.get('description', '')
        price = request.POST.get('price')
        original_price = request.POST.get('original_price') or None
        category = request.POST.get('category')
        section = request.POST.get('section', '')
        brand = request.POST.get('brand', '')
        colors_raw = request.POST.get('colors', '')
        sizes_raw = request.POST.get('sizes', '')
        is_new = request.POST.get('is_new') == 'on'
        on_sale = request.POST.get('on_sale') == 'on'
        is_limited_stock = request.POST.get('is_limited_stock') == 'on'
        stock_count = int(request.POST.get('stock_count', 0))
        discount = request.POST.get('discount') or None
        image = request.FILES.get('image')

        colors = [c.strip() for c in colors_raw.split(',') if c.strip()]
        sizes = [s.strip() for s in sizes_raw.split(',') if s.strip()]

        if category not in dict(Product._meta.get_field('category').choices):
            messages.error(request, 'Invalid category selected.')
            return redirect('admin_product_add')

        product = Product(
            name=name, description=description, price=price,
            original_price=original_price, category=category,
            section=section, brand=brand, colors=colors, sizes=sizes,
            is_new=is_new, on_sale=on_sale, is_limited_stock=is_limited_stock,
            stock_count=stock_count, discount=discount
        )
        if image:
            product.image = image
        else:
            safe_name = ''.join(ch.lower() if ch.isalnum() else '-' for ch in name).strip('-') or 'product'
            product.image.save(f'{safe_name}.png', _placeholder_product_image(name), save=False)
        product.save()
        log_stock_change(
            product=product,
            old_stock=0,
            new_stock=product.stock_count,
            changed_by=request.user,
            reason='Product created from admin panel',
        )
        messages.success(request, f'Product "{name}" added successfully.')
        return redirect('admin_products')
    
    return render(request, 'admin_panel/product_form.html', {'action': 'Add', 'product': None})


@admin_login_required
def admin_product_edit(request, pk):
    product = get_object_or_404(Product, pk=pk)
    if request.method == 'POST':
        old_stock = product.stock_count
        product.name = request.POST.get('name')
        product.description = request.POST.get('description', '')
        product.price = request.POST.get('price')
        product.original_price = request.POST.get('original_price') or None
        category = request.POST.get('category')
        if category not in dict(Product._meta.get_field('category').choices):
            messages.error(request, 'Invalid category selected.')
            return redirect('admin_product_edit', pk=pk)

        product.category = category
        product.section = request.POST.get('section', '')
        product.brand = request.POST.get('brand', '')
        colors_raw = request.POST.get('colors', '')
        sizes_raw = request.POST.get('sizes', '')
        product.colors = [c.strip() for c in colors_raw.split(',') if c.strip()]
        product.sizes = [s.strip() for s in sizes_raw.split(',') if s.strip()]
        product.is_new = request.POST.get('is_new') == 'on'
        product.on_sale = request.POST.get('on_sale') == 'on'
        product.is_limited_stock = request.POST.get('is_limited_stock') == 'on'
        product.stock_count = int(request.POST.get('stock_count', 0))
        product.discount = request.POST.get('discount') or None
        image = request.FILES.get('image')
        if image:
            product.image = image
        product.save()
        log_stock_change(
            product=product,
            old_stock=old_stock,
            new_stock=product.stock_count,
            changed_by=request.user,
            reason='Product edited from admin panel',
        )
        messages.success(request, f'Product "{product.name}" updated.')
        return redirect('admin_products')
    
    return render(request, 'admin_panel/product_form.html', {'action': 'Edit', 'product': product})


@admin_login_required
def admin_product_delete(request, pk):
    product = get_object_or_404(Product, pk=pk)
    if request.method == 'POST':
        name = product.name
        product.delete()
        messages.success(request, f'Product "{name}" deleted.')
    return redirect('admin_products')


@admin_login_required
def admin_orders(request):
    search = request.GET.get('search', '')
    status_filter = request.GET.get('status', '')
    
    orders = Order.objects.all()
    if search:
        orders = orders.filter(Q(email__icontains=search) | Q(first_name__icontains=search) | Q(last_name__icontains=search))
    if status_filter:
        orders = orders.filter(status=status_filter)
    
    orders = orders.order_by('-created_at')
    return render(request, 'admin_panel/orders.html', {'orders': orders, 'search': search, 'status_filter': status_filter})


@admin_login_required
def admin_order_detail(request, pk):
    order = get_object_or_404(Order, pk=pk)
    items = order.items.select_related('product').all()
    
    if request.method == 'POST':
        new_status = request.POST.get('status')
        if new_status:
            old_status = order.status
            restock_statuses = {'cancelled', 'returned'}

            if new_status != old_status:
                try:
                    with transaction.atomic():
                        order_items = list(order.items.select_related('product').all())

                        if old_status not in restock_statuses and new_status in restock_statuses:
                            for item in order_items:
                                product = Product.objects.select_for_update().get(pk=item.product_id)
                                old_stock = product.stock_count
                                product.stock_count += item.quantity
                                product.is_limited_stock = 0 < product.stock_count <= 5
                                product.save(update_fields=['stock_count', 'is_limited_stock'])
                                log_stock_change(
                                    product=product,
                                    old_stock=old_stock,
                                    new_stock=product.stock_count,
                                    changed_by=request.user,
                                    reason=f'Order #{order.id} moved to {new_status}',
                                )

                        if old_status in restock_statuses and new_status not in restock_statuses:
                            for item in order_items:
                                product = Product.objects.select_for_update().get(pk=item.product_id)
                                if product.stock_count < item.quantity:
                                    messages.error(
                                        request,
                                        f'Cannot mark order #{order.id} as {new_status}. "{product.name}" stock is insufficient.',
                                    )
                                    return redirect('admin_order_detail', pk=pk)
                                old_stock = product.stock_count
                                product.stock_count -= item.quantity
                                product.is_limited_stock = 0 < product.stock_count <= 5
                                product.save(update_fields=['stock_count', 'is_limited_stock'])
                                log_stock_change(
                                    product=product,
                                    old_stock=old_stock,
                                    new_stock=product.stock_count,
                                    changed_by=request.user,
                                    reason=f'Order #{order.id} moved to {new_status}',
                                )

                        order.status = new_status
                        order.save(update_fields=['status'])

                    messages.success(request, f'Order #{order.id} status updated to "{new_status}".')
                    return redirect('admin_order_detail', pk=pk)
                except Exception:
                    messages.error(request, 'Failed to update order status. Please try again.')
                    return redirect('admin_order_detail', pk=pk)
    
    return render(request, 'admin_panel/order_detail.html', {'order': order, 'items': items})


@admin_login_required
def admin_stock(request):
    search = request.GET.get('search', '')
    category = request.GET.get('category', '')

    if request.method == 'POST':
        product_id = request.POST.get('product_id')
        action = request.POST.get('action')
        product = get_object_or_404(Product, pk=product_id)

        if action == 'update_stock':
            try:
                new_stock = int(request.POST.get('stock_count', product.stock_count))
                if new_stock < 0:
                    raise ValueError()
                old_stock = product.stock_count
                product.stock_count = new_stock
                product.is_limited_stock = 0 < new_stock <= 5
                product.save(update_fields=['stock_count', 'is_limited_stock'])
                log_stock_change(
                    product=product,
                    old_stock=old_stock,
                    new_stock=new_stock,
                    changed_by=request.user,
                    reason='Manual stock update from stock page',
                )
                messages.success(request, f'Stock updated for "{product.name}".')
            except (TypeError, ValueError):
                messages.error(request, 'Please enter a valid stock quantity (0 or more).')

        elif action == 'mark_out_of_stock':
            old_stock = product.stock_count
            product.stock_count = 0
            product.is_limited_stock = False
            product.save(update_fields=['stock_count', 'is_limited_stock'])
            log_stock_change(
                product=product,
                old_stock=old_stock,
                new_stock=0,
                changed_by=request.user,
                reason='Marked out of stock from stock page',
            )
            messages.success(request, f'"{product.name}" marked as out of stock.')

        return redirect('admin_stock')

    products = Product.objects.all()
    if search:
        products = products.filter(Q(name__icontains=search) | Q(brand__icontains=search))
    if category:
        products = products.filter(category=category)

    products = products.order_by('stock_count', 'name')
    total_stock_units = products.aggregate(total=Sum('stock_count'))['total'] or 0
    out_of_stock_products = products.filter(stock_count=0).count()
    low_stock_products = products.filter(stock_count__gt=0, stock_count__lte=5).count()

    context = {
        'products': products,
        'search': search,
        'category': category,
        'total_stock_units': total_stock_units,
        'out_of_stock_products': out_of_stock_products,
        'low_stock_products': low_stock_products,
    }
    return render(request, 'admin_panel/stock.html', context)


@admin_login_required
def admin_stock_history(request):
    search = request.GET.get('search', '')
    logs = StockHistory.objects.select_related('product', 'changed_by').all()

    if search:
        logs = logs.filter(
            Q(product__name__icontains=search)
            | Q(product__brand__icontains=search)
            | Q(changed_by__username__icontains=search)
            | Q(reason__icontains=search)
        )

    logs = logs.order_by('-created_at')
    return render(request, 'admin_panel/stock_history.html', {'logs': logs, 'search': search})


@admin_login_required
def admin_orders_placed(request):
    search = request.GET.get('search', '')
    orders = Order.objects.exclude(status='cancelled')
    if search:
        orders = orders.filter(Q(email__icontains=search) | Q(first_name__icontains=search) | Q(last_name__icontains=search))

    orders = orders.order_by('-created_at')
    total_amount = orders.aggregate(total=Sum('total_amount'))['total'] or 0

    context = {
        'orders': orders,
        'search': search,
        'title': 'Order Placed Details',
        'subtitle': 'All orders except cancelled',
        'badge_label': 'Placed',
        'badge_class': 'bg-emerald-100 text-emerald-700',
        'total_orders': orders.count(),
        'total_amount': total_amount,
    }
    return render(request, 'admin_panel/order_status_details.html', context)


@admin_login_required
def admin_orders_cancelled(request):
    search = request.GET.get('search', '')
    orders = Order.objects.filter(status='cancelled')
    if search:
        orders = orders.filter(Q(email__icontains=search) | Q(first_name__icontains=search) | Q(last_name__icontains=search))

    orders = orders.order_by('-created_at')
    total_amount = orders.aggregate(total=Sum('total_amount'))['total'] or 0

    context = {
        'orders': orders,
        'search': search,
        'title': 'Cancelled Order Details',
        'subtitle': 'Orders cancelled by customer or admin',
        'badge_label': 'Cancelled',
        'badge_class': 'bg-red-100 text-red-700',
        'total_orders': orders.count(),
        'total_amount': total_amount,
    }
    return render(request, 'admin_panel/order_status_details.html', context)


@admin_login_required
def admin_payments(request):
    search = request.GET.get('search', '')
    payment_mode = request.GET.get('payment_mode', '')

    orders = Order.objects.all()
    if search:
        orders = orders.filter(Q(email__icontains=search) | Q(first_name__icontains=search) | Q(last_name__icontains=search))
    if payment_mode:
        orders = orders.filter(payment_mode=payment_mode)

    orders = orders.order_by('-created_at')

    payment_summary = Order.objects.values('payment_mode').annotate(
        total_orders=Count('id'),
        total_amount=Sum('total_amount'),
    )
    payment_summary_map = {item['payment_mode']: item for item in payment_summary}

    cod_summary = payment_summary_map.get('cod', {'total_orders': 0, 'total_amount': 0})
    upi_summary = payment_summary_map.get('upi', {'total_orders': 0, 'total_amount': 0})
    card_summary = payment_summary_map.get('card', {'total_orders': 0, 'total_amount': 0})

    context = {
        'orders': orders,
        'search': search,
        'payment_mode': payment_mode,
        'cod_summary': cod_summary,
        'upi_summary': upi_summary,
        'card_summary': card_summary,
    }
    return render(request, 'admin_panel/payments.html', context)
