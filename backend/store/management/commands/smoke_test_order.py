from __future__ import annotations

from io import BytesIO

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand

from PIL import Image, ImageDraw

from store.models import Product
from store.serializers import OrderSerializer


class Command(BaseCommand):
    help = "Smoke test: create an order with payment_mode and clean up."

    def handle(self, *args, **options):
        img_path = None
        product_id = None
        order_id = None

        try:
            img = Image.new("RGB", (400, 500), (229, 231, 235))
            draw = ImageDraw.Draw(img)
            draw.rectangle((20, 20, 380, 480), outline=(148, 163, 184), width=3)
            draw.text((200, 250), "TS", fill=(15, 23, 42), anchor="mm")

            buf = BytesIO()
            img.save(buf, format="PNG")
            cf = ContentFile(buf.getvalue())

            product = Product.objects.create(
                name="__TEST__ Product",
                description="test",
                price="10.00",
                category="men",
                section="shoes",
                brand="Excito",
                colors=["black"],
                sizes=["7"],
                stock_count=1,
            )
            product_id = product.id
            product.image.save("test.png", cf, save=True)
            img_path = product.image.name

            data = {
                "first_name": "Test",
                "last_name": "User",
                "email": "test@example.com",
                "phone": "9999999999",
                "payment_mode": "upi",
                "address_line1": "Line1",
                "address_line2": "",
                "city": "City",
                "state": "State",
                "postal_code": "000000",
                "country": "IN",
                "items": [
                    {
                        "product": product.id,
                        "quantity": 1,
                        "size": "7",
                        "color": "black",
                    }
                ],
            }

            serializer = OrderSerializer(data=data)
            serializer.is_valid(raise_exception=True)
            order = serializer.save()
            order_id = order.id

            self.stdout.write(self.style.SUCCESS(
                f"ORDER_OK id={order.id} payment_mode={order.payment_mode} total_amount={order.total_amount}"
            ))

            # Clean up: delete order then product
            order.delete()
            product.delete()

            if img_path:
                default_storage.delete(img_path)

            self.stdout.write(self.style.SUCCESS("CLEAN_OK"))

        except Exception as exc:
            self.stdout.write(self.style.ERROR(f"SMOKE_FAIL: {exc}"))
            self.stdout.write(self.style.ERROR(
                f"Debug: product_id={product_id} order_id={order_id} img_path={img_path}"
            ))
            raise
