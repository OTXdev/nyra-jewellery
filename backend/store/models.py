import random
import string

from django.db import models
from django.utils.text import slugify


def generate_order_number():
    """Generate a unique-looking order number like NYRA-7K3F9A."""
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=6))
    return f"NYRA-{suffix}"


class Category(models.Model):
    """Fixed top-level category: Rings, Necklaces, Bracelets, Sets."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="categories/", blank=True, null=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Collection(models.Model):
    """Curated product collection, e.g. 'Ramadan Edit', 'Bridal Line'."""

    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=170, unique=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="collections/", blank=True, null=True)
    featured = models.BooleanField(default=False)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(blank=True)

    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="products"
    )
    collection = models.ForeignKey(
        Collection,
        on_delete=models.SET_NULL,
        related_name="products",
        blank=True,
        null=True,
    )

    # Prices are stored as integers (Algerian Dinar, no decimals).
    price = models.PositiveIntegerField(help_text="Price in DA")
    old_price = models.PositiveIntegerField(
        blank=True, null=True, help_text="Original price in DA, for promotions"
    )

    material = models.CharField(max_length=150, blank=True)
    in_stock = models.BooleanField(default=True)
    is_new = models.BooleanField(default=False)
    is_best_seller = models.BooleanField(default=False)
    on_promotion = models.BooleanField(default=False)

    sizes = models.JSONField(
        blank=True, null=True, help_text='e.g. ["6", "7", "8"]'
    )

    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                counter += 1
                slug = f"{base_slug}-{counter}"
            self.slug = slug
        super().save(*args, **kwargs)


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="products/")
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Image for {self.product.name} (#{self.pk})"


class Wilaya(models.Model):
    """The 58 Algerian provinces, each with a COD delivery fee."""

    code = models.CharField(max_length=2, unique=True)
    name = models.CharField(max_length=100, unique=True)
    delivery_fee = models.PositiveIntegerField(default=0, help_text="Home delivery fee in DA")
    stopdesk_fee = models.PositiveIntegerField(
        blank=True, null=True, help_text="Stopdesk delivery fee in DA (optional)"
    )

    class Meta:
        verbose_name_plural = "Wilayas"
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} - {self.name}"


class Order(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "New"
        CONFIRMED = "confirmed", "Confirmed"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    order_number = models.CharField(max_length=20, unique=True, blank=True)

    customer_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=30)
    wilaya = models.CharField(max_length=100)
    commune = models.CharField(max_length=150)
    address = models.TextField()
    notes = models.TextField(blank=True)

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.NEW
    )

    subtotal = models.PositiveIntegerField(help_text="DA")
    delivery_fee = models.PositiveIntegerField(help_text="DA")
    total = models.PositiveIntegerField(help_text="DA")

    payment_method = models.CharField(max_length=30, default="cash_on_delivery")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.order_number

    def save(self, *args, **kwargs):
        if not self.order_number:
            order_number = generate_order_number()
            while Order.objects.filter(order_number=order_number).exists():
                order_number = generate_order_number()
            self.order_number = order_number
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        Product, on_delete=models.SET_NULL, related_name="order_items", null=True
    )

    # Snapshots taken at order time, so later product edits never change history.
    product_name = models.CharField(max_length=200)
    price = models.PositiveIntegerField(help_text="Unit price in DA at time of order")
    quantity = models.PositiveIntegerField()
    size = models.CharField(max_length=20, blank=True)
    line_total = models.PositiveIntegerField(help_text="DA")

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"


class ContactMessage(models.Model):
    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.subject} ({self.name})"


class SiteSettings(models.Model):
    """
    Singleton model for editable site-wide contact and social information.
    Always use SiteSettings.get() to retrieve the single instance.
    """

    phone = models.CharField(max_length=50, blank=True, help_text="Phone number (digits only, e.g. 213555000000)")
    phone_display = models.CharField(max_length=50, blank=True, help_text="Formatted phone for display, e.g. +213 555 00 00 00")
    email = models.EmailField(blank=True)
    address = models.CharField(max_length=200, blank=True)
    instagram = models.URLField(blank=True)
    tiktok = models.URLField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Site Settings"
        verbose_name_plural = "Site Settings"

    def __str__(self):
        return "Site Settings"

    @classmethod
    def get(cls):
        """Return the singleton instance, creating it with defaults if needed."""
        obj, _ = cls.objects.get_or_create(
            pk=1,
            defaults={
                "phone": "213555000000",
                "phone_display": "+213 555 00 00 00",
                "email": "hello@nyrajewellery.com",
                "address": "Alger, Algeria",
                "instagram": "https://instagram.com",
                "tiktok": "https://tiktok.com",
            },
        )
        return obj
