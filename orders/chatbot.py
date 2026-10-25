import json
import random

from django.conf import settings
from django.db.models import Max, Min
from django.http import JsonResponse
from django.views.decorators.http import require_POST

from .models import Dish, SiteSetting
from .views import MEAL_INFO, meal_list, meal_state

CONTACT = 'Visit us near the campus gate, call 90740 92355, or WhatsApp us from the Contact section at the bottom of the home page.'


def has(msg, *words):
    return any(w in msg for w in words)


def available_now():
    """Dishes that can be ordered this minute: meal is being served and the dish is not sold out."""
    if not SiteSetting.load().accepting_orders:
        return 'Nothing is available right now. We are not taking pre-orders at the moment, please check back soon.'
    live = next((m for m in meal_list() if meal_state(m['key']) == 'open'), None)
    if live:
        names = list(Dish.objects.filter(meal=live['key'], is_available=True)
                     .order_by('category', 'name').values_list('name', flat=True))
        if names:
            return f'Available now ({live["label"]}, until {live["end_label"]}):\n' + '\n'.join(f'- {n}' for n in names)
        return f'Nothing is available right now. Every {live["label"].lower()} dish is sold out.'
    upcoming = [m for m in meal_list() if meal_state(m['key']) == 'later']
    nxt = upcoming[0] if upcoming else meal_list()[0]
    when = 'later today' if upcoming else 'tomorrow'
    return f'Nothing is available right now. {nxt["label"]} starts {when} at {nxt["start_label"]}.'


def answer(raw):
    msg = raw.lower().strip()
    if not msg:
        return 'Type a question and I will help.'
    options = ' or '.join(f'{p}%' for p in getattr(settings, 'ADVANCE_OPTIONS', [50]))

    # 1. A dish name was mentioned: price, meal and stock.
    for d in Dish.objects.all():
        if d.name.lower() in msg:
            stock = 'available' if d.is_available else 'sold out right now'
            return (f'{d.name}: Rs {d.price:.0f}, served at {MEAL_INFO[d.meal]["label"].lower()}. '
                    f'It is {stock}.')

    asks_timing = has(msg, 'time', 'timing', 'hours', 'when', 'open', 'schedule')
    if has(msg, 'available', 'now', 'serving', 'in stock', 'stock') and not asks_timing:
        return available_now()

    if asks_timing or has(msg, 'available', 'now', 'serving'):
        names = {'open': 'serving now', 'later': 'starts later today', 'closed': 'finished for today'}
        lines = [f'{m["label"]}: {m["start_label"]} to {m["end_label"]} ({names[meal_state(m["key"])]})'
                 for m in meal_list()]
        return "Today's meals:\n" + '\n'.join(lines)

    if has(msg, 'cancel', 'refund'):
        return ('You can cancel from your token page until the kitchen starts preparing the order. '
                'For a refund of the advance, please speak to the counter.')

    if has(msg, 'token', 'expire', 'valid', 'timer', 'late'):
        return 'Your token does not expire. Keep the number and show it at the counter when you collect.'

    if has(msg, 'advance', 'razorpay', 'upi', 'card', 'pay', 'payment', 'cash'):
        return (f'You pay {options} of the bill online (Razorpay) to get your token, '
                'and the rest at the counter when you collect.')

    if has(msg, 'pickup', 'pick up', 'collect', 'delivery'):
        return 'Pickup only. Show your token number at the counter and pay the balance there.'

    if has(msg, 'price', 'cost', 'cheap', 'rupee', 'rs'):
        r = Dish.objects.aggregate(lo=Min('price'), hi=Max('price'))
        if r['lo'] is None:
            return 'The menu is being updated. Please check back soon.'
        return f'Dishes range from Rs {r["lo"]:.0f} to Rs {r["hi"]:.0f}. Ask me about a dish for its exact price.'

    if has(msg, 'order', 'how'):
        return ('How to order:\n1. Pick a meal and add dishes\n2. Go to checkout, enter your name and phone\n'
                f'3. Pay the {options} advance online\n4. Get your token, collect and pay the rest at the counter')

    if has(msg, 'menu', 'food', 'dish', 'eat', 'have'):
        live = next((m for m in meal_list() if meal_state(m['key']) == 'open'), None)
        if live:
            ds = Dish.objects.filter(meal=live['key'], is_available=True).values_list('name', flat=True)
            return f'{live["label"]} is on now: ' + (', '.join(ds) or 'everything is sold out.')
        return 'No meal is being served right now. You can still browse any menu from the home page.'

    if has(msg, 'contact', 'support', 'help', 'phone', 'call'):
        return CONTACT

    if has(msg, 'hi', 'hello', 'hey'):
        return 'Hi! Ask me about meal timings, prices, payment or how to order.'

    return random.choice([
        'Could you tell me more? I can help with timings, prices, the menu and ordering.',
        'Try asking: "What\'s available now?" or "How to order?"',
    ])


@require_POST
def chat(request):
    try:
        message = json.loads(request.body).get('message', '')
    except (ValueError, AttributeError):
        message = ''
    return JsonResponse({'reply': answer(str(message)[:200])})
