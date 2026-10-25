from django.urls import path

from . import chatbot, staff_auth, views

urlpatterns = [
    path('', views.menu, name='menu'),
    path('about/', views.about, name='about'),
    path('menu/<slug:meal>/', views.meal_menu, name='meal_menu'),
    path('stock/', views.stock_json, name='stock_json'),
    path('checkout/', views.checkout, name='checkout'),
    path('location/', views.location, name='location'),
    # payment (Razorpay)
    path('pay/<int:pk>/', views.pay, name='pay'),
    path('payment/verify/', views.payment_verify, name='payment_verify'),
    path('payment/demo/<int:pk>/', views.payment_demo, name='payment_demo'),
    path('payment/webhook/', views.razorpay_webhook, name='razorpay_webhook'),
    path('token/<int:pk>/', views.token_view, name='token'),
    path('order/<int:pk>/', views.order_done, name='order_done'),
    path('order/<int:pk>/status/', views.order_status, name='order_status'),
    path('order/<int:pk>/cancel/', views.cancel_order, name='cancel_order'),
    # chatbot
    path('chatbot/', views.chatbot, name='chatbot'),
    path('chat/', chatbot.chat, name='chat'),
    # staff
    path('staff/login/', staff_auth.StaffLoginView.as_view(), name='staff_login'),
    path('staff/logout/', staff_auth.StaffLogoutView.as_view(), name='staff_logout'),
    path('staff/', views.staff_orders, name='staff_orders'),
    path('staff/menu/', views.staff_menu, name='staff_menu'),
    path('staff/api/orders/', views.staff_orders_json, name='staff_orders_json'),
    path('staff/api/orders/<int:pk>/status/', views.set_status, name='set_status'),
    path('staff/api/dishes/<int:pk>/stock/', views.set_stock, name='set_stock'),
]
