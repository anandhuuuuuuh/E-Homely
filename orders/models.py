import random

from django.db import models
from django.db.models import Q
from django.utils import timezone

# Open = not collected and not cancelled yet. Tokens never expire, so an order
# stays open until staff mark it picked up or cancelled.
OPEN_STATUSES = ['new', 'preparing', 'ready', 'out_of_stock']


class Dish(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=7, decimal_places=2)
    is_available = models.BooleanField(default=True)
    MEALS = [('breakfast', 'Breakfast'), ('lunch', 'Lunch'), ('dinner', 'Dinner')]
    meal = models.CharField(max_length=10, choices=MEALS, default='lunch')
    image = models.ImageField(upload_to='dishes/', blank=True)

    def __str__(self):
        return self.name


class Order(models.Model):
    STATUS = [
        ('new', 'New'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('picked_up', 'Picked up'),
        ('out_of_stock', 'Out of stock'),
        ('cancelled', 'Cancelled'),
    ]
    PAYMENT = [('unpaid', 'Unpaid'), ('paid', 'Paid'), ('refunded', 'Refunded')]

    order_no = models.CharField(max_length=4, editable=False)
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    status = models.CharField(max_length=12, choices=STATUS, default='new')
    note = models.CharField(max_length=200, blank=True)
    total = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    created = models.DateTimeField(auto_now_add=True)

    # Payment: the customer pays an advance online (Razorpay), the rest at the counter.
    payment_status = models.CharField(max_length=10, choices=PAYMENT, default='unpaid')
    advance_percent = models.PositiveSmallIntegerField(default=0)
    advance_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    razorpay_order_id = models.CharField(max_length=40, blank=True, default='', db_index=True)
    razorpay_payment_id = models.CharField(max_length=40, blank=True, default='')
    paid_at = models.DateTimeField(null=True, blank=True)

    @property
    def balance(self):
        """What the customer still pays at the counter."""
        return self.total - self.advance_amount

    def save(self, *args, **kwargs):
        if not self.order_no:
            # Random 4-digit token, unique among today's orders and every order
            # that is still open (tokens do not expire).
            today = timezone.localdate()
            while True:
                code = str(random.randint(1000, 9999))
                clash = Order.objects.filter(order_no=code).filter(
                    Q(created__date=today) | Q(status__in=OPEN_STATUSES)
                ).exists()
                if not clash:
                    break
            self.order_no = code
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    dish = models.ForeignKey(Dish, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=7, decimal_places=2)  # price when ordered


class SiteSetting(models.Model):
    accepting_orders = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        self.pk = 1  # there is only ever one row
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
