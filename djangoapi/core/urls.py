from django.urls import path, include
from . import views
from rest_framework import routers

from knox.views import LogoutView as KnoxLogoutView
from knox.views import LogoutAllView as KnoxLogoutAllView

router = routers.DefaultRouter()
#router.register(r'core', views.BuildingsModelViewSet)

urlpatterns = [
    path("hello_world/", views.HelloWord.as_view(),name="hello_world"),
    path('', include(router.urls)),
    path('not_loggedin/', views.notLoggedIn, name="not_loggedin"),
    path('login/', views.LoginView.as_view(),name="login"),
    path('logout/', views.LogoutView.as_view(),name="login"),
    path('isloggedin/', views.IsLoggedIn.as_view(),name="isloggedin"),

    # Vistas Knox para API (para Angular)
    path('knox/login/', views.KnoxLoginAPIView.as_view(), name='knox_login'),
    path('knox/logout/', KnoxLogoutView.as_view(), name='knox_logout'),
    path('knox/logoutall/', KnoxLogoutAllView.as_view(), name='knox_logoutall'),
    path('knox/is_valid_token/', views.is_valid_token, name='knox_is_valid_token'),
]