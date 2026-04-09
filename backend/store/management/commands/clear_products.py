from __future__ import annotations

import os

from django.core.management.base import BaseCommand
from django.db.models.deletion import ProtectedError

from store.models import Product


class Command(BaseCommand):
    help = 'Delete all products from the database.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--delete-images',
            action='store_true',
            help='Also delete product image files from storage.',
        )

    def handle(self, *args, **options):
        delete_images: bool = bool(options.get('delete_images'))

        products = list(Product.objects.all())
        if not products:
            self.stdout.write(self.style.SUCCESS('No products to delete.'))
            return

        image_paths: list[str] = []
        if delete_images:
            for product in products:
                if not product.image:
                    continue
                try:
                    path = product.image.path
                except Exception:
                    continue
                if path:
                    image_paths.append(path)

        try:
            deleted_count, _details = Product.objects.all().delete()
        except ProtectedError:
            self.stdout.write(self.style.ERROR(
                'Cannot delete products because they are referenced by existing order items. '
                'Delete related orders/order items first, then re-run this command.'
            ))
            return

        deleted_files = 0
        missing_files = 0
        if delete_images:
            for path in image_paths:
                if os.path.exists(path):
                    try:
                        os.remove(path)
                        deleted_files += 1
                    except OSError:
                        pass
                else:
                    missing_files += 1

        msg = f'Deleted {deleted_count} objects.'
        if delete_images:
            msg += f' Image files deleted: {deleted_files}'
            if missing_files:
                msg += f' (missing: {missing_files})'
        self.stdout.write(self.style.SUCCESS(msg))
