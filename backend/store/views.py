from django.db.models import Count, Q, Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import (
    Category,
    Collection,
    ContactMessage,
    Order,
    OrderItem,
    Product,
    ProductImage,
    SiteSettings,
    Wilaya,
)

from .permissions import IsAdminOrReadOnly, IsStaffUser

from .serializers import (
    AdminAccountUpdateSerializer,
    CategorySerializer,
    CollectionSerializer,
    ContactMessageSerializer,
    OrderCreateSerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
    ProductDetailSerializer,
    ProductImageSerializer,
    ProductListSerializer,
    ProductWriteSerializer,
    SiteSettingsSerializer,
    StaffTokenObtainPairSerializer,
    WilayaSerializer,
)


class StaffTokenObtainPairView(TokenObtainPairView):
    serializer_class = StaffTokenObtainPairSerializer
    throttle_scope = "staff_login"


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class CollectionViewSet(viewsets.ModelViewSet):
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related(
        "category",
        "collection",
    ).prefetch_related("images")

    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = {
        "category__slug": ["exact"],
        "collection__slug": ["exact"],
        "on_promotion": ["exact"],
        "is_new": ["exact"],
        "is_best_seller": ["exact"],
        "in_stock": ["exact"],
    }

    search_fields = [
        "name",
        "description",
    ]

    ordering_fields = [
        "price",
        "created_at",
        "rating",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()

        category = self.request.query_params.get("category")
        collection = self.request.query_params.get("collection")

        if category:
            qs = qs.filter(category__slug=category)

        if collection:
            qs = qs.filter(collection__slug=collection)

        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer

        if self.action == "retrieve":
            return ProductDetailSerializer

        return ProductWriteSerializer


class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    permission_classes = [IsStaffUser]

    def get_queryset(self):
        qs = super().get_queryset()

        product_id = self.request.query_params.get("product")

        if product_id:
            qs = qs.filter(product_id=product_id)

        return qs


class WilayaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Wilaya.objects.all()
    serializer_class = WilayaSerializer
    permission_classes = [AllowAny]
    pagination_class = None


class OrderCreateView(generics.CreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderCreateSerializer
    permission_classes = [AllowAny]
    throttle_scope = "order_create"


class AdminOrderViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Order.objects.prefetch_related("items").all()
    serializer_class = OrderSerializer
    permission_classes = [IsStaffUser]

    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
    ]

    filterset_fields = ["status"]

    ordering_fields = [
        "created_at",
        "total",
    ]

    ordering = ["-created_at"]

    @action(detail=True, methods=["patch"], url_path="status")
    def update_status(self, request, pk=None):
        order = self.get_object()

        serializer = OrderStatusUpdateSerializer(
            order,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            OrderSerializer(order).data
        )

    def partial_update(self, request, *args, **kwargs):
        order = self.get_object()

        serializer = OrderStatusUpdateSerializer(
            order,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            OrderSerializer(order).data
        )

    @action(detail=False, methods=["post"], url_path="bulk-delete")
    def bulk_delete(self, request):
        ids = request.data.get("ids")

        if ids is None:
            return Response(
                {
                    "detail": "A non-empty list of order ids is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(ids, list) or not ids:
            return Response(
                {
                    "detail": "No orders selected."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        invalid = [
            value
            for value in ids
            if not (
                isinstance(value, int)
                and not isinstance(value, bool)
            )
        ]

        if invalid:
            return Response(
                {
                    "detail": "All ids must be integers.",
                    "errors": {
                        "ids": invalid
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        deleted, _ = Order.objects.filter(
            id__in=ids
        ).delete()

        return Response(
            {
                "detail": f"Deleted {deleted} order(s)."
            },
            status=status.HTTP_200_OK,
        )


class ContactMessageCreateView(generics.CreateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [AllowAny]
    throttle_scope = "contact_create"


class AdminContactMessageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [IsStaffUser]

    filterset_fields = ["is_read"]

    filter_backends = [
        DjangoFilterBackend
    ]

    @action(detail=True, methods=["patch"], url_path="read")
    def mark_read(self, request, pk=None):
        message = self.get_object()

        message.is_read = True
        message.save(update_fields=["is_read"])

        return Response(
            ContactMessageSerializer(message).data
        )


class AdminStatsView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        orders = Order.objects.all()

        total_revenue = (
            orders
            .filter(status=Order.Status.DELIVERED)
            .aggregate(total=Sum("total"))["total"]
            or 0
        )

        total_orders = orders.count()

        orders_by_status = {
            row["status"]: row["count"]
            for row in orders
            .values("status")
            .annotate(count=Count("id"))
        }

        for choice, _label in Order.Status.choices:
            orders_by_status.setdefault(
                choice,
                0
            )

        total_products = Product.objects.count()

        unread_messages = ContactMessage.objects.filter(
            is_read=False
        ).count()

        return Response(
            {
                "total_revenue": total_revenue,
                "total_orders": total_orders,
                "orders_by_status": orders_by_status,
                "total_products": total_products,
                "unread_messages": unread_messages,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        Order.objects.filter(
            status=Order.Status.DELIVERED
        ).delete()

        return self.get(request)


class SiteSettingsView(APIView):
    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def get_permissions(self):
        if self.request.method in ("PATCH", "PUT"):
            return [IsStaffUser()]

        return [AllowAny()]

    def get(self, request):
        settings = SiteSettings.get()

        serializer = SiteSettingsSerializer(
            settings,
            context={
                "request": request
            },
        )

        return Response(
            serializer.data
        )

    def patch(self, request):
        settings = SiteSettings.get()

        serializer = SiteSettingsSerializer(
            settings,
            data=request.data,
            partial=True,
            context={
                "request": request
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            serializer.data
        )

    def put(self, request):
        return self.patch(request)


class AdminAccountUpdateView(APIView):
    permission_classes = [IsStaffUser]

    def patch(self, request):
        serializer = AdminAccountUpdateSerializer(
            data=request.data,
            context={
                "request": request
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "detail": "Account updated successfully.",
            }
        )