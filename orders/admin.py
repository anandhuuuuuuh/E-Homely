from django.contrib import admin
from .models import Dish, Order, OrderItem, SiteSetting


@admin.register(Dish)
class DishAdmin(admin.ModelAdmin):
    list_display = ('name', 'meal', 'category', 'price', 'is_available')
    list_editable = ('meal', 'price', 'is_available')
    list_filter = ('meal', 'category')


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_no', 'name', 'phone', 'status', 'payment_status',
                    'advance_amount', 'total', 'created')
    list_filter = ('status', 'payment_status')
    search_fields = ('order_no', 'name', 'phone', 'razorpay_payment_id')
    inlines = [OrderItemInline]


@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ('accepting_orders',)
