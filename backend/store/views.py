from rest_framework import generics
from .models import Product, Order
from .serializers import ProductSerializer, OrderSerializer


class ProductList(generics.ListAPIView):
    serializer_class = ProductSerializer

    def get_queryset(self):
        queryset = Product.objects.all().order_by('-id')
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset


class ProductDetail(generics.RetrieveAPIView):
    serializer_class = ProductSerializer
    queryset = Product.objects.all()


class OrderCreate(generics.CreateAPIView):
    serializer_class = OrderSerializer


class OrderDetail(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    queryset = Order.objects.all()
