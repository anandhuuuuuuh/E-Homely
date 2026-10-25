"""Regression tests for the checkout -> pay -> token flow."""
import json

from django.test import Client, TestCase, override_settings
from django.urls import reverse

from orders import payments
from orders.models import Dish, Order


@override_settings(DEBUG=True)  # dev "test mode": no Razorpay keys, simulated payment
class CheckoutTokenFlowTest(TestCase):
    def setUp(self):
        self.dish = Dish.objects.create(name='Appam', meal='breakfast', category='x',
                                        price=25, is_available=True)
        self.cart = json.dumps({str(self.dish.pk): 2})

    def browser(self, ui='phone'):
        c = Client()
        c.cookies['ui'] = ui
        return c

    def place(self, c):
        res = c.post(reverse('checkout'), {'name': 'Asha', 'phone': '9876543210',
                                           'advance': '50', 'cart': self.cart})
        self.assertEqual(res.status_code, 302)
        return Order.objects.latest('pk')

    def test_normal_flow_phone_and_desktop(self):
        for ui in ('phone', 'desktop'):
            c = self.browser(ui)
            o = self.place(c)
            self.assertEqual(c.get(reverse('pay', args=[o.pk])).status_code, 200)
            res = c.post(reverse('payment_demo', args=[o.pk]))
            self.assertRedirects(res, reverse('order_done', args=[o.pk]))
            self.assertContains(c.get(reverse('order_done', args=[o.pk])), o.order_no)
            self.assertEqual(c.get(reverse('order_status', args=[o.pk])).status_code, 200)

    def test_token_works_when_webhook_paid_before_browser_returned(self):
        c = self.browser()
        o = self.place(c)
        payments.mark_paid(o.razorpay_order_id, 'pay_x')  # webhook path: no browser callback
        # Re-opening the pay page, or the token page, lands on the token.
        self.assertRedirects(c.get(reverse('pay', args=[o.pk])), reverse('order_done', args=[o.pk]))
        self.assertContains(c.get(reverse('order_done', args=[o.pk])), o.order_no)
        self.assertEqual(c.get(reverse('order_status', args=[o.pk])).status_code, 200)

    def test_bad_signature_after_webhook_still_shows_token(self):
        c = self.browser()
        o = self.place(c)
        payments.mark_paid(o.razorpay_order_id, 'pay_x')
        res = c.post(reverse('payment_verify'), {'razorpay_order_id': o.razorpay_order_id,
                                                 'razorpay_payment_id': 'pay_x',
                                                 'razorpay_signature': 'nope'})
        self.assertRedirects(res, reverse('order_done', args=[o.pk]))

    def test_bad_signature_unpaid_goes_back_to_pay_page(self):
        c = self.browser()
        o = self.place(c)
        res = c.post(reverse('payment_verify'), {'razorpay_order_id': o.razorpay_order_id,
                                                 'razorpay_payment_id': 'pay_x',
                                                 'razorpay_signature': 'nope'})
        self.assertRedirects(res, reverse('pay', args=[o.pk]) + '?failed=1')

    def test_second_checkout_does_not_break_first_pay_page(self):
        c = self.browser()
        first, second = self.place(c), self.place(c)
        self.assertEqual(c.get(reverse('pay', args=[first.pk])).status_code, 200)
        self.assertEqual(c.get(reverse('pay', args=[second.pk])).status_code, 200)

    def test_unpaid_token_url_redirects_to_pay(self):
        c = self.browser()
        o = self.place(c)
        self.assertRedirects(c.get(reverse('order_done', args=[o.pk])), reverse('pay', args=[o.pk]))

    def test_cancel_after_webhook_payment(self):
        c = self.browser()
        o = self.place(c)
        payments.mark_paid(o.razorpay_order_id, 'pay_x')
        c.post(reverse('cancel_order', args=[o.pk]))
        o.refresh_from_db()
        self.assertEqual(o.status, 'cancelled')

    def test_other_browser_cannot_see_someone_elses_token(self):
        c = self.browser()
        o = self.place(c)
        payments.mark_paid(o.razorpay_order_id, 'pay_x')
        stranger = self.browser()
        for name in ('order_done', 'order_status', 'pay'):
            self.assertEqual(stranger.get(reverse(name, args=[o.pk])).status_code, 404, name)
        self.assertEqual(stranger.post(reverse('cancel_order', args=[o.pk])).status_code, 404)
        o.refresh_from_db()
        self.assertNotEqual(o.status, 'cancelled')

    def test_stranger_cannot_open_unpaid_pay_page(self):
        o = self.place(self.browser())
        self.assertEqual(self.browser().get(reverse('pay', args=[o.pk])).status_code, 404)
