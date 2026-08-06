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


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class StaffTokenObtainPairView(TokenObtainPairView):
    serializer_class = StaffTokenObtainPairSerializer


# ---------------------------------------------------------------------------
# Category / Collection — public read, staff write
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Products — public read (with filters/search), staff write
# ---------------------------------------------------------------------------

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category", "collection").prefetch_related("images")
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        "category__slug": ["exact"],
        "collection__slug": ["exact"],
        "on_promotion": ["exact"],
        "is_new": ["exact"],
        "is_best_seller": ["exact"],
        "in_stock": ["exact"],
    }
    search_fields = ["name", "description"]
    ordering_fields = ["price", "created_at", "rating"]
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
    """
    Admin-only endpoint for uploading/deleting product photos.
    POST multipart/form-data with `product`, `image`, `is_primary`, `order`.
    """

    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    permission_classes = [IsStaffUser]

    def get_queryset(self):
        qs = super().get_queryset()
        product_id = self.request.query_params.get("product")
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs


# ---------------------------------------------------------------------------
# Wilayas — public read only
# ---------------------------------------------------------------------------

class WilayaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Wilaya.objects.all()
    serializer_class = WilayaSerializer
    permission_classes = [AllowAny]
    pagination_class = None


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

class OrderCreateView(generics.CreateAPIView):
    """Public: POST /api/orders/ — place a Cash on Delivery order."""

    queryset = Order.objects.all()
    serializer_class = OrderCreateSerializer
    permission_classes = [AllowAny]


class AdminOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin: list/retrieve orders, plus a status-update action."""

    queryset = Order.objects.prefetch_related("items").all()
    serializer_class = OrderSerializer
    permission_classes = [IsStaffUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["status"]
    ordering_fields = ["created_at", "total"]
    ordering = ["-created_at"]

    @action(detail=True, methods=["patch"], url_path="status")
    def update_status(self, request, pk=None):
        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OrderSerializer(order).data)

    def partial_update(self, request, *args, **kwargs):
        # Allow PATCH directly on /api/admin/orders/{id}/ too, not just the
        # /status/ sub-action, for convenience.
        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OrderSerializer(order).data)

    @action(detail=False, methods=["post"], url_path="bulk-delete")
    def bulk_delete(self, request):
        """Admin: POST /api/admin/orders/bulk-delete/ with {"ids": [...]}."""
        ids = request.data.get("ids", [])
        if not isinstance(ids, list) or not ids:
            return Response(
                {"detail": "No orders selected."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        deleted, _ = Order.objects.filter(id__in=ids).delete()
        return Response(
            {"detail": f"Deleted {deleted} order(s)."},
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Contact messages
# ---------------------------------------------------------------------------

class ContactMessageCreateView(generics.CreateAPIView):
    """Public: POST /api/contact/"""

    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [AllowAny]


class AdminContactMessageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [IsStaffUser]
    filterset_fields = ["is_read"]
    filter_backends = [DjangoFilterBackend]

    @action(detail=True, methods=["patch"], url_path="read")
    def mark_read(self, request, pk=None):
        message = self.get_object()
        message.is_read = True
        message.save(update_fields=["is_read"])
        return Response(ContactMessageSerializer(message).data)


# ---------------------------------------------------------------------------
# Admin dashboard stats
# ---------------------------------------------------------------------------

class AdminStatsView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        orders = Order.objects.all()
        # Revenue counts only DELIVERED orders.
        total_revenue = (
            orders.filter(status=Order.Status.DELIVERED).aggregate(total=Sum("total"))["total"] or 0
        )
        total_orders = orders.count()

        orders_by_status = {
            row["status"]: row["count"]
            for row in orders.values("status").annotate(count=Count("id"))
        }
        for choice, _label in Order.Status.choices:
            orders_by_status.setdefault(choice, 0)

        total_products = Product.objects.count()
        unread_messages = ContactMessage.objects.filter(is_read=False).count()

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
        """
        Reset revenue to 0. Revenue is the sum of DELIVERED orders only, so
        this deletes all delivered orders, which zeroes the revenue figure.
        """
        # Delete only delivered orders — that's what counts toward revenue.
        Order.objects.filter(status=Order.Status.DELIVERED).delete()
        return self.get(request)


# ---------------------------------------------------------------------------
# Site Settings — public GET, admin PATCH
# ---------------------------------------------------------------------------

class SiteSettingsView(APIView):
    """
    GET  /api/site-settings/ — public, returns contact info for the footer.
    PATCH /api/site-settings/ — admin only, updates contact/social fields.
    """

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method in ("PATCH", "PUT"):
            return [IsStaffUser()]
        return [AllowAny()]

    def get(self, request):
        settings = SiteSettings.get()
        serializer = SiteSettingsSerializer(settings, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        settings = SiteSettings.get()
        serializer = SiteSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def put(self, request):
        return self.patch(request)


# ---------------------------------------------------------------------------
# Admin account management
# ---------------------------------------------------------------------------

class AdminAccountUpdateView(APIView):
    """
    PATCH /api/admin/account/ — lets the logged-in admin change their
    username and/or password.
    """

    permission_classes = [IsStaffUser]

    def patch(self, request):
        serializer = AdminAccountUpdateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "detail": "Account updated successfully.",
            }
        )
