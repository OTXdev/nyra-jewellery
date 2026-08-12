from django.conf import settings
from django.db.models import Count, Q, Sum
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .jwt_cookies import clear_auth_cookies, set_auth_cookies, set_access_cookie, set_refresh_cookie
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
    """
    POST /api/auth/login/ — authenticates a staff user and sets the access
    + refresh JWTs as HttpOnly cookies. The tokens are never included in
    the JSON response body, so they are never reachable from JavaScript.
    """

    serializer_class = StaffTokenObtainPairSerializer
    throttle_scope = "staff_login"

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        access = data.pop("access")
        refresh = data.pop("refresh")

        response = Response(data, status=status.HTTP_200_OK)
        set_auth_cookies(response, access, refresh)
        return response


class CookieTokenRefreshView(APIView):
    """
    POST /api/auth/refresh/ — reads the refresh token from the HttpOnly
    `nyra_refresh_token` cookie (never from the request body), validates
    it, and replaces the `nyra_access_token` cookie with a freshly issued
    access token. Because SIMPLE_JWT["ROTATE_REFRESH_TOKENS"] is True, the
    refresh cookie itself is also rotated and the old refresh token is
    blacklisted.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = None

    def post(self, request, *args, **kwargs):
        raw_refresh = request.COOKIES.get(settings.JWT_REFRESH_COOKIE)
        if not raw_refresh:
            return Response(
                {"detail": "No refresh token cookie present."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(data={"refresh": raw_refresh})
        try:
            serializer.is_valid(raise_exception=True)
        except (InvalidToken, TokenError):
            response = Response(
                {"detail": "Refresh token is invalid or expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            clear_auth_cookies(response)
            return response

        data = serializer.validated_data
        response = Response({"detail": "Token refreshed."}, status=status.HTTP_200_OK)
        set_access_cookie(response, data["access"])
        # Only present when ROTATE_REFRESH_TOKENS is enabled.
        if "refresh" in data:
            set_refresh_cookie(response, data["refresh"])
        return response


class LogoutView(APIView):
    """
    POST /api/auth/logout/ — reads the refresh token from the HttpOnly
    cookie (the frontend never has to know or send it), blacklists it,
    and clears both auth cookies. Idempotent: always clears cookies even
    if the refresh token was already missing/invalid/expired.
    """

    permission_classes = [IsStaffUser]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE)

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                # Already blacklisted/expired/malformed — nothing more to
                # do server-side, but we still clear the client's cookies.
                pass

        response = Response({"detail": "Logout successful."}, status=status.HTTP_200_OK)
        clear_auth_cookies(response)
        return response


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfTokenView(APIView):
    """
    GET /api/auth/csrf/ — has no purpose other than to make Django set the
    (non-HttpOnly, JS-readable) `csrftoken` cookie via ensure_csrf_cookie.
    The frontend calls this once before login/admin actions so it has a
    CSRF token to echo back in the `X-CSRFToken` header on unsafe
    (POST/PUT/PATCH/DELETE) requests — required because CookieJWTAuthentication
    enforces CSRF checks whenever auth comes from the cookie.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"detail": "CSRF cookie set."})

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
    parser_classes = [MultiPartParser, FormParser, JSONParser]


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
    throttle_scope = "order_create"


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
        """
        Admin: POST /api/admin/orders/bulk-delete/ with {"ids": [...]}.

        `ids` must be a non-empty list of integers. Non-integer values
        (strings, floats, booleans, null, dicts, lists, etc.) are rejected
        with a 400 response so they never reach the ORM.
        """
        ids = request.data.get("ids")
        if ids is None:
            return Response(
                {"detail": "A non-empty list of order ids is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(ids, list) or not ids:
            return Response(
                {"detail": "No orders selected."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invalid = [
            value
            for value in ids
            if not (isinstance(value, int) and not isinstance(value, bool))
        ]
        if invalid:
            return Response(
                {
                    "detail": "All ids must be integers.",
                    "errors": {"ids": invalid},
                },
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
    throttle_scope = "contact_create"


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
        serializer = SiteSettingsSerializer(
            settings, data=request.data, partial=True, context={"request": request}
        )
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
