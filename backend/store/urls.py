from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

# ---------------------------------------------------------------------------
# Public router
# ---------------------------------------------------------------------------
public_router = DefaultRouter()
public_router.register("categories", views.CategoryViewSet, basename="category")
public_router.register("collections", views.CollectionViewSet, basename="collection")
public_router.register("products", views.ProductViewSet, basename="product")
public_router.register("wilayas", views.WilayaViewSet, basename="wilaya")

# ---------------------------------------------------------------------------
# Admin router
# ---------------------------------------------------------------------------
admin_router = DefaultRouter()
admin_router.register("orders", views.AdminOrderViewSet, basename="admin-order")
admin_router.register("contact-messages", views.AdminContactMessageViewSet, basename="admin-contact-message")
admin_router.register("product-images", views.ProductImageViewSet, basename="admin-product-image")

urlpatterns = [
    # Auth
    path("auth/login/", views.StaffTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Public
    path("orders/", views.OrderCreateView.as_view(), name="order-create"),
    path("contact/", views.ContactMessageCreateView.as_view(), name="contact-create"),
    path("site-settings/", views.SiteSettingsView.as_view(), name="site-settings"),
    path("", include(public_router.urls)),

    # Admin
    path("admin/stats/", views.AdminStatsView.as_view(), name="admin-stats"),
    path("admin/account/", views.AdminAccountUpdateView.as_view(), name="admin-account"),
    path("admin/", include(admin_router.urls)),
]
