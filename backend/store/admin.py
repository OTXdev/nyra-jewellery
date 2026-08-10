from django.contrib import admin

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


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "name_en", "name_ar", "slug"]
    search_fields = ["name", "name_en", "name_ar", "description"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "featured"]
    list_filter = ["featured"]
    prepopulated_fields = {"slug": ("name",)}


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "category",
        "collection",
        "price",
        "old_price",
        "in_stock",
        "is_new",
        "is_best_seller",
        "on_promotion",
        "created_at",
    ]
    list_filter = [
        "category",
        "collection",
        "in_stock",
        "is_new",
        "is_best_seller",
        "on_promotion",
    ]
    search_fields = [
        "name",
        "description",
        "category__name",
        "category__name_en",
        "category__name_ar",
    ]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductImageInline]


@admin.register(Wilaya)
class WilayaAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "delivery_fee", "stopdesk_fee"]
    ordering = ["code"]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = [
        "product",
        "product_name",
        "price",
        "quantity",
        "size",
        "line_total",
    ]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "order_number",
        "customer_name",
        "phone",
        "wilaya",
        "delivery_method",
        "status",
        "total",
        "created_at",
    ]
    list_filter = ["status", "wilaya", "delivery_method"]
    search_fields = ["order_number", "customer_name", "phone"]
    inlines = [OrderItemInline]
    readonly_fields = [
        "order_number",
        "subtotal",
        "delivery_fee",
        "total",
        "delivery_method",
        "created_at",
        "updated_at",
    ]


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ["subject", "name", "email", "is_read", "created_at"]
    list_filter = ["is_read"]
    search_fields = ["name", "email", "subject", "message"]


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ["email", "phone_display", "address", "updated_at"]
    readonly_fields = ["updated_at"]