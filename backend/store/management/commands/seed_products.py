from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from store.models import Product

from io import BytesIO

from PIL import Image, ImageDraw


class Command(BaseCommand):
    help = 'Seed the database with sample products'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing products before seeding.',
        )

    def _placeholder_image(self, *, name: str, color: tuple[int, int, int], size: tuple[int, int] = (400, 500)) -> ContentFile:
        img = Image.new('RGB', size, color)
        draw = ImageDraw.Draw(img)
        draw.rectangle((20, 20, size[0] - 20, size[1] - 20), outline=(255, 255, 255), width=3)
        initials = ''.join(word[0] for word in name.split()[:2]).upper() or 'PR'
        draw.text((size[0] // 2, size[1] // 2 - 10), initials, fill=(255, 255, 255), anchor='mm')
        draw.text((size[0] // 2, size[1] - 42), 'EXCITO', fill=(255, 255, 255), anchor='mm')
        buf = BytesIO()
        img.save(buf, format='PNG')
        return ContentFile(buf.getvalue())

    def handle(self, *args, **options):
        if options.get('clear'):
            Product.objects.all().delete()

        products = [
            {
                'name': 'Men Black T-Shirt',
                'description': 'Classic men\'s black tee.',
                'price': 299.99,
                'stock_count': 25,
                'category': 'men',
                'section': 'all',
                'brand': 'BrandA',
                'colors': ['black', 'white'],
                'sizes': ['S', 'M', 'L', 'XL'],
                'is_new': True,
            },
            {
                'name': 'Women Floral Dress',
                'description': 'Beautiful floral dress for women.',
                'price': 899.50,
                'original_price': 1099.00,
                'stock_count': 12,
                'category': 'women',
                'section': 'dresses',
                'brand': 'BrandB',
                'colors': ['multicolor'],
                'sizes': ['S', 'M', 'L'],
                'on_sale': True,
                'discount': 20,
            },
            {
                'name': 'Kids Running Shoes',
                'description': 'Comfortable running shoes for kids.',
                'price': 499.00,
                'stock_count': 18,
                'category': 'kids',
                'section': 'footwear',
                'brand': 'BrandC',
                'colors': ['blue', 'red'],
                'sizes': ['28', '29', '30', '31'],
            },
            {
                'name': 'Men Denim Jacket',
                'description': 'Stylish men\'s denim jacket.',
                'price': 1499.00,
                'stock_count': 7,
                'category': 'men',
                'section': 'jackets',
                'brand': 'BrandD',
                'colors': ['blue'],
                'sizes': ['M', 'L', 'XL'],
            },
            {
                'name': 'Women Yoga Pants',
                'description': 'Stretchy pants for yoga and workouts.',
                'price': 699.00,
                'stock_count': 20,
                'category': 'women',
                'section': 'activewear',
                'brand': 'BrandE',
                'colors': ['black', 'gray'],
                'sizes': ['S', 'M', 'L'],
            },
            {
                'name': 'Kids Cartoon T-Shirt',
                'description': 'Fun t-shirt with cartoon print.',
                'price': 249.99,
                'stock_count': 30,
                'category': 'kids',
                'section': 'tshirts',
                'brand': 'BrandF',
                'colors': ['white', 'red'],
                'sizes': ['S', 'M', 'L'],
            },
            {
                'name': 'Men Leather Belt',
                'description': 'Genuine leather belt for men.',
                'price': 399.00,
                'stock_count': 40,
                'category': 'men',
                'section': 'accessories',
                'brand': 'BrandG',
                'colors': ['black', 'brown'],
                'sizes': [],
            },
            {
                'name': 'Women Handbag',
                'description': 'Elegant handbag for all occasions.',
                'price': 1299.00,
                'original_price': 1599.00,
                'stock_count': 6,
                'category': 'women',
                'section': 'bags',
                'brand': 'BrandH',
                'colors': ['pink', 'black'],
                'sizes': [],
                'on_sale': True,
                'discount': 15,
            },
            {
                'name': 'Kids Winter Jacket',
                'description': 'Warm jacket for kids in winter.',
                'price': 1199.00,
                'stock_count': 9,
                'category': 'kids',
                'section': 'jackets',
                'brand': 'BrandI',
                'colors': ['blue', 'green'],
                'sizes': ['S', 'M', 'L'],
                'is_new': True,
            },
            {
                'name': 'Men Running Shorts',
                'description': 'Lightweight running shorts for men.',
                'price': 599.00,
                'original_price': 799.00,
                'stock_count': 15,
                'category': 'sale',
                'section': 'shorts',
                'brand': 'BrandJ',
                'colors': ['gray', 'black'],
                'sizes': ['M', 'L', 'XL'],
                'on_sale': True,
                'discount': 30,
            },
        ]

        category_color = {
            'men': (59, 130, 246),
            'women': (236, 72, 153),
            'kids': (234, 179, 8),
            'sale': (239, 68, 68),
        }

        created_count = 0
        updated_count = 0
        image_count = 0

        for prod in products:
            name = prod['name']
            defaults = {k: v for k, v in prod.items() if k != 'name'}
            product, created = Product.objects.update_or_create(name=name, defaults=defaults)
            if created:
                created_count += 1
            else:
                updated_count += 1

            if not product.image:
                color = category_color.get(product.category, (229, 231, 235))
                img_content = self._placeholder_image(name=product.name, color=color)
                safe_name = ''.join(ch.lower() if ch.isalnum() else '-' for ch in product.name).strip('-')
                product.image.save(f'{safe_name}.png', img_content, save=True)
                image_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Seed complete. Created: {created_count}, Updated: {updated_count}, Images generated: {image_count}.'
        ))
