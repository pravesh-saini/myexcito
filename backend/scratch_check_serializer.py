import os
import django
import json
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'excito_backend.settings')
django.setup()

from store.models import Product
from store.serializers import ProductSerializer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

factory = APIRequestFactory()
request = factory.get('/')
# We need to simulate a full request to get absolute URIs
request.META['HTTP_HOST'] = '127.0.0.1:8000'

product = Product.objects.first()
if product:
    serializer = ProductSerializer(product, context={'request': request})
    print(json.dumps(serializer.data, indent=2))
else:
    print("No products found")
