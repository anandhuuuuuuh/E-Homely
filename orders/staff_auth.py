"""Staff sign-in / sign-out. Only users with is_staff can get into /staff/."""
from django import forms
from django.contrib.auth import views as auth_views
from django.contrib.auth.forms import AuthenticationForm
from django.urls import reverse_lazy


class StaffAuthForm(AuthenticationForm):
    error_messages = {
        **AuthenticationForm.error_messages,
        'invalid_login': 'Wrong username or password. Please try again.',
        'not_staff': 'This account does not have staff access.',
    }

    def confirm_login_allowed(self, user):
        super().confirm_login_allowed(user)
        if not user.is_staff:
            raise forms.ValidationError(self.error_messages['not_staff'], code='not_staff')


class StaffLoginView(auth_views.LoginView):
    template_name = 'orders/staff_login.html'
    authentication_form = StaffAuthForm
    redirect_authenticated_user = True
    next_page = reverse_lazy('staff_orders')

    def get_default_redirect_url(self):
        return str(reverse_lazy('staff_orders'))

    def dispatch(self, request, *args, **kwargs):
        # redirect_authenticated_user would bounce a logged-in non-staff customer to the staff page
        # and loop; only skip the form for real staff.
        if request.user.is_authenticated and not request.user.is_staff:
            self.redirect_authenticated_user = False
        return super().dispatch(request, *args, **kwargs)


class StaffLogoutView(auth_views.LogoutView):
    next_page = reverse_lazy('staff_login')
