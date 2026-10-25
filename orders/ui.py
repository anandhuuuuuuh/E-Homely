from django.shortcuts import render

PHONE_WORDS = ('iphone', 'android', 'mobile', 'ipod', 'windows phone')


def is_desktop(request):
    """Cookie 'ui' (set by the page from the real screen width) wins;
    before it exists we guess from the user agent."""
    ui = request.COOKIES.get('ui')
    if ui in ('desktop', 'phone'):
        return ui == 'desktop'
    ua = request.META.get('HTTP_USER_AGENT', '').lower()
    return not any(w in ua for w in PHONE_WORDS)


def render_ui(request, name, context=None):
    """Laptop/large screens get orders/desktop/<name>; phones get orders/<name>.
    If a desktop version does not exist, the phone one is used."""
    desktop = is_desktop(request)
    names = [f'orders/{name}']
    if desktop:
        names.insert(0, f'orders/desktop/{name}')
    ctx = dict(context or {}, is_desktop=desktop, ui_check=True)
    return render(request, names, ctx)
