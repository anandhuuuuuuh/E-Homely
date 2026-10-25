"""Razorpay architecture (no extra packages needed).

Flow
 1. checkout   -> we create an Order (payment_status='unpaid') and a Razorpay
                  order for the ADVANCE amount only. Prices come from the DB.
 2. pay page   -> browser opens Razorpay Checkout with that order_id.
 3. callback   -> browser posts payment_id + signature to /payment/verify/.
                  We verify the HMAC signature on the server, mark the order
                  'paid' and show the token.
 4. webhook    -> Razorpay also calls /payment/webhook/ (payment.captured /
                  order.paid). This marks the order paid even if the customer
                  closed the tab after paying. Both paths are idempotent.
"""
import base64
import hashlib
import hmac
import json
import urllib.error
import urllib.request
from decimal import ROUND_HALF_UP, Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import Order

API_URL = 'https://api.razorpay.com/v1/orders'


class PaymentError(Exception):
    pass


def keys_configured():
    return bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET)


def to_paise(amount):
    return int((Decimal(amount) * 100).quantize(Decimal('1'), rounding=ROUND_HALF_UP))


def advance_for(total, percent):
    return (Decimal(total) * percent / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def create_order(order):
    """Create a Razorpay order for the order's advance amount. Returns the JSON."""
    payload = json.dumps({
        'amount': to_paise(order.advance_amount),
        'currency': 'INR',
        'receipt': f'ehomely-{order.pk}',
        'notes': {'order_pk': str(order.pk), 'name': order.name[:40]},
    }).encode()
    auth = base64.b64encode(
        f'{settings.RAZORPAY_KEY_ID}:{settings.RAZORPAY_KEY_SECRET}'.encode()
    ).decode()
    req = urllib.request.Request(API_URL, data=payload, headers={
        'Content-Type': 'application/json',
        'Authorization': f'Basic {auth}',
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.load(resp)
    except (urllib.error.URLError, OSError, ValueError) as exc:
        raise PaymentError(str(exc)) from exc


def _hmac(secret, message):
    return hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()


def verify_signature(rzp_order_id, payment_id, signature):
    if not (rzp_order_id and payment_id and signature and settings.RAZORPAY_KEY_SECRET):
        return False
    expected = _hmac(settings.RAZORPAY_KEY_SECRET, f'{rzp_order_id}|{payment_id}'.encode())
    return hmac.compare_digest(expected, signature)


def verify_webhook(body, signature):
    if not (signature and settings.RAZORPAY_WEBHOOK_SECRET):
        return False
    return hmac.compare_digest(_hmac(settings.RAZORPAY_WEBHOOK_SECRET, body), signature)


def mark_paid(rzp_order_id, payment_id, amount_paise=None):
    """Mark the order paid. Safe to call twice. Returns the order or None."""
    with transaction.atomic():
        order = Order.objects.select_for_update().filter(razorpay_order_id=rzp_order_id).first()
        if order is None:
            return None
        if amount_paise is not None and amount_paise != to_paise(order.advance_amount):
            return None
        if order.payment_status != 'paid':
            order.payment_status = 'paid'
            order.razorpay_payment_id = payment_id
            order.paid_at = timezone.now()
            order.save(update_fields=['payment_status', 'razorpay_payment_id', 'paid_at'])
        return order
