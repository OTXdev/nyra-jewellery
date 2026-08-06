from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

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

User = get_user_model()


# ---------------------------------------------------------------------------
# Category / Collection
# ---------------------------------------------------------------------------

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "image"]
        read_only_fields = ["slug"]


class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = ["id", "name", "slug", "description", "image", "featured"]
        read_only_fields = ["slug"]


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "product", "image", "is_primary", "order"]
        read_only_fields = ["id"]
        extra_kwargs = {"product": {"write_only": True}}


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer used for list views."""

    category = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    collection = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "category",
            "collection",
            "price",
            "old_price",
            "material",
            "in_stock",
            "is_new",
            "is_best_seller",
            "on_promotion",
            "rating",
            "primary_image",
            "created_at",
        ]

    def get_primary_image(self, obj):
        images = list(obj.images.all())
        if not images:
            return None
        primary = next((img for img in images if img.is_primary), images[0])
        request = self.context.get("request")
        url = primary.image.url
        return request.build_absolute_uri(url) if request else url


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    collection = CollectionSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    related_products = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "category",
            "collection",
            "price",
            "old_price",
            "material",
            "in_stock",
            "is_new",
            "is_best_seller",
            "on_promotion",
            "sizes",
            "rating",
            "images",
            "related_products",
            "created_at",
        ]

    def get_related_products(self, obj):
        related = (
            Product.objects.filter(category=obj.category)
            .exclude(pk=obj.pk)
            .order_by("-created_at")[:4]
        )
        return ProductListSerializer(related, many=True, context=self.context).data


class ProductWriteSerializer(serializers.ModelSerializer):
    """Used by admin CRUD. Image files are handled by ProductImageViewSet."""

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "category",
            "collection",
            "price",
            "old_price",
            "material",
            "in_stock",
            "is_new",
            "is_best_seller",
            "on_promotion",
            "sizes",
            "rating",
            "created_at",
        ]
        read_only_fields = ["id", "slug", "created_at"]


# ---------------------------------------------------------------------------
# Wilaya
# ---------------------------------------------------------------------------

class WilayaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wilaya
        fields = ["id", "code", "name", "delivery_fee", "stopdesk_fee"]


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "price", "quantity", "size", "line_total"]
        read_only_fields = ["id", "product_name", "price", "line_total"]


class OrderItemInputSerializer(serializers.Serializer):
    """What the storefront actually sends when creating an order."""

    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    size = serializers.CharField(required=False, allow_blank=True, default="")


class OrderSerializer(serializers.ModelSerializer):
    """Read serializer for admin order list/detail."""

    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "customer_name",
            "phone",
            "wilaya",
            "commune",
            "address",
                "delivery_method",
                "notes",
                "status",
"subtotal",
                "delivery_fee",
"total",
                "payment_method",
                "items",
                "created_at",
                "updated_at",
            ]
        read_only_fields = [f for f in fields if f != "status"]


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["status"]


# Free-delivery threshold (must match frontend FREE_DELIVERY_THRESHOLD constant).
FREE_DELIVERY_THRESHOLD = 7000


class OrderCreateSerializer(serializers.Serializer):
    """
    Public-facing order creation serializer. Prices/totals are always
    recomputed server-side from the database — client-sent amounts are
    never trusted.

    Free delivery is applied automatically when subtotal >= FREE_DELIVERY_THRESHOLD.
    """

    customer_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=30)
    wilaya_id = serializers.IntegerField()
    commune = serializers.CharField(max_length=150)
    # Address is required for home delivery but optional for stopdesk pickup.
    address = serializers.CharField(required=False, allow_blank=True, default="")
    delivery_method = serializers.ChoiceField(choices=[("home","À domicile"),("stopdesk","Au bureau")], default="home", required=False)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    items = OrderItemInputSerializer(many=True)

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("An order must contain at least one item.")
        return items

    def validate_wilaya_id(self, value):
        if not Wilaya.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Selected wilaya does not exist.")
        return value

    def validate(self, attrs):
        product_ids = [item["product_id"] for item in attrs["items"]]
        products = Product.objects.filter(pk__in=product_ids)
        products_by_id = {p.pk: p for p in products}

        missing = set(product_ids) - set(products_by_id.keys())
        if missing:
            raise serializers.ValidationError(
                {"items": f"Unknown product id(s): {', '.join(str(m) for m in missing)}"}
            )

        out_of_stock = [
            products_by_id[pid].name
            for pid in product_ids
            if not products_by_id[pid].in_stock
        ]
        if out_of_stock:
            raise serializers.ValidationError(
                {"items": f"Out of stock: {', '.join(out_of_stock)}"}
            )

        # Ensure wilaya exists (validate_wilaya_id already checks id existence)
        attrs["_products_by_id"] = products_by_id
        # Validate address presence when delivery_method is home
        delivery_method = attrs.get("delivery_method", "home")
        addr = attrs.get("address", "") or ""
        if delivery_method == "home" and not addr.strip():
            raise serializers.ValidationError({"address": "Address is required for home delivery."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        products_by_id = validated_data.pop("_products_by_id")
        wilaya = Wilaya.objects.get(pk=validated_data.pop("wilaya_id"))
        items_data = validated_data.pop("items")

        subtotal = 0
        line_items = []
        for item in items_data:
            product = products_by_id[item["product_id"]]
            quantity = item["quantity"]
            line_total = product.price * quantity
            subtotal += line_total
            line_items.append(
                {
                    "product": product,
                    "product_name": product.name,
                    "price": product.price,
                    "quantity": quantity,
                    "size": item.get("size", ""),
                    "line_total": line_total,
                }
            )

        # Determine which fee to use depending on delivery method.
        delivery_method = validated_data.get("delivery_method", "home")
        # Apply free-delivery rule: if subtotal >= threshold, fee becomes 0 for both methods.
        if subtotal >= FREE_DELIVERY_THRESHOLD:
            delivery_fee = 0
        else:
            if delivery_method == "home":
                delivery_fee = wilaya.delivery_fee
            else:
                # Use stopdesk_fee when available, otherwise fall back to delivery_fee.
                delivery_fee = wilaya.stopdesk_fee if (wilaya.stopdesk_fee is not None) else wilaya.delivery_fee
        total = subtotal + delivery_fee

        order = Order.objects.create(
            customer_name=validated_data["customer_name"],
            phone=validated_data["phone"],
            wilaya=wilaya.name,
            commune=validated_data["commune"],
            address=validated_data.get("address", ""),
            delivery_method=delivery_method,
            notes=validated_data.get("notes", ""),
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            total=total,
        )

        OrderItem.objects.bulk_create(
            [OrderItem(order=order, **line) for line in line_items]
        )

        return order

    def to_representation(self, instance):
        return OrderSerializer(instance, context=self.context).data


# ---------------------------------------------------------------------------
# Contact
# ---------------------------------------------------------------------------

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "phone", "subject", "message", "created_at", "is_read"]
        read_only_fields = ["id", "created_at", "is_read"]


# ---------------------------------------------------------------------------
# Site Settings
# ---------------------------------------------------------------------------

class SiteSettingsSerializer(serializers.ModelSerializer):
    hero_image = serializers.ImageField(required=False, allow_null=True)
    about_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = SiteSettings
        fields = [
            "phone",
            "phone_display",
            "email",
            "address",
            "instagram",
            "tiktok",
            "hero_image",
            "about_image",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer  # noqa: E402


class StaffTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Only allows login for staff (admin dashboard) users."""

    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_staff:
            raise serializers.ValidationError("This account does not have admin access.")
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
        }
        return data


# ---------------------------------------------------------------------------
# Admin account management
# ---------------------------------------------------------------------------

class AdminAccountUpdateSerializer(serializers.Serializer):
    """Allows the admin to change their username and/or password."""

    username = serializers.CharField(max_length=150, required=False)
    current_password = serializers.CharField(write_only=True, required=False)
    new_password = serializers.CharField(write_only=True, required=False)

    def validate(self, attrs):
        user = self.context["request"].user

        new_password = attrs.get("new_password")
        current_password = attrs.get("current_password")

        if new_password:
            if not current_password:
                raise serializers.ValidationError(
                    {"current_password": "Current password is required to set a new password."}
                )
            if not user.check_password(current_password):
                raise serializers.ValidationError(
                    {"current_password": "Current password is incorrect."}
                )
            try:
                validate_password(new_password, user=user)
            except Exception as exc:
                raise serializers.ValidationError({"new_password": list(exc.messages)})

        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        username = self.validated_data.get("username")
        new_password = self.validated_data.get("new_password")

        if username:
            # Ensure no other user has this username.
            if User.objects.exclude(pk=user.pk).filter(username=username).exists():
                raise serializers.ValidationError(
                    {"username": "This username is already taken."}
                )
            user.username = username

        if new_password:
            user.set_password(new_password)

        user.save()
        return user
