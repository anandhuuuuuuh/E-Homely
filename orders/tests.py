from django.test import TestCase, Client
from django.urls import reverse
from orders.models import Dish, Order, SiteSetting


class WebsitePagesTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.site_setting = SiteSetting.load()
        self.dish = Dish.objects.create(
            name='Test Appam',
            meal='breakfast',
            category='Breakfast Special',
            price=25.00,
            is_available=True,
        )

    def test_home_page_mobile_and_desktop(self):
        # Mobile view
        self.client.cookies['ui'] = 'phone'
        res_mobile = self.client.get(reverse('menu'))
        self.assertEqual(res_mobile.status_code, 200)
        self.assertContains(res_mobile, 'Breakfast')
        self.assertContains(res_mobile, 'Lunch')
        self.assertContains(res_mobile, 'Dinner')

        # Desktop view
        self.client.cookies['ui'] = 'desktop'
        res_desktop = self.client.get(reverse('menu'))
        self.assertEqual(res_desktop.status_code, 200)
        self.assertContains(res_desktop, 'Choose your')

    def test_meal_menu_page(self):
        res = self.client.get(reverse('meal_menu', args=['breakfast']))
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Test Appam')

    def test_checkout_page(self):
        res = self.client.get(reverse('checkout'))
        self.assertEqual(res.status_code, 200)

    def test_stock_api(self):
        res = self.client.get(reverse('stock_json'))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn('dishes', data)
        self.assertTrue(any(d['name'] == 'Test Appam' for d in data['dishes']))
