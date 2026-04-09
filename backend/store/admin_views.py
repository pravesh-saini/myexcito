from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import user_passes_test
from django.contrib import messages
from django.db.models import Sum, Count, Q
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.core.files.base import ContentFile
from io import BytesIO
from PIL import Image, ImageDraw
import json
from .models import Product, Order, OrderItem


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
    total_orders = Order.objects.count()
    pending_orders = Order.objects.filter(status='pending').count()
    total_products = Product.objects.count()
    total_revenue = Order.objects.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    recent_orders = Order.objects.order_by('-created_at')[:8]
    
    category_stats = Product.objects.values('category').annotate(count=Count('id'))
    
    context = {
        'total_orders': total_orders,
        'pending_orders': pending_orders,
        'total_products': total_products,
        'total_revenue': total_revenue,
        'recent_orders': recent_orders,
        'category_stats': list(category_stats),
    }
    return render(request, 'admin_panel/dashboard.html', context)


@admin_login_required
def admin_products(request):
    search = request.GET.get('search', '')
    category = request.GET.get('category', '')
    
    products = Product.objects.all()
    if search:
        products = products.filter(Q(name__icontains=search) | Q(brand__icontains=search))
    if category:
        products = products.filter(category=category)
    
    products = products.order_by('-id')
    return render(
        request,
        'admin_panel/products.html',
        {
            'products': products,
            'search': search,
            'category': category,
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
        messages.success(request, f'Product "{name}" added successfully.')
        return redirect('admin_products')
    
    return render(request, 'admin_panel/product_form.html', {'action': 'Add', 'product': None})


@admin_login_required
def admin_product_edit(request, pk):
    product = get_object_or_404(Product, pk=pk)
    if request.method == 'POST':
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
            order.status = new_status
            order.save()
            messages.success(request, f'Order #{order.id} status updated to "{new_status}".')
            return redirect('admin_order_detail', pk=pk)
    
    return render(request, 'admin_panel/order_detail.html', {'order': order, 'items': items})
