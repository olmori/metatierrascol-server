#Django imports
from django.http import JsonResponse
from django.views import View
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect
import random, time

# Añadir estos imports al inicio del archivo
from knox.views import LoginView as KnoxLoginView
from knox.views import LogoutView as KnoxLogoutView
from knox.views import LogoutAllView as KnoxLogoutAllView
from knox.models import AuthToken
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import login as django_login

# Añadir estas nuevas clases/funciones
class KnoxLoginAPIView(KnoxLoginView):
    permission_classes = []
    
    def post(self, request, format=None):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if not user:
            return Response(
                {'detail': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Login the user
        django_login(request, user)
        
        # Verificar cuántos tokens tiene el usuario
        token_count = AuthToken.objects.filter(user=user).count()
        
        if token_count >= 10:
            return Response({
                'username': user.username,
                'groups': list(user.groups.values_list('name', flat=True)),
                'opened_sessions': token_count,
                'detail': 'Se ha excedido el número máximo de tokens (10)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear el token usando el método parent
        response = super().post(request, format=None)
        
        # Añadir información adicional que espera el frontend
        token_data = response.data
        token_data['username'] = user.username
        token_data['groups'] = list(user.groups.values_list('name', flat=True))
        token_data['opened_sessions'] = AuthToken.objects.filter(user=user).count()
        
        return Response(token_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def is_valid_token(request):
    """Verifica si el token es válido y devuelve información del usuario"""
    user = request.user
    return Response({
        'username': user.username,
        'groups': list(user.groups.values_list('name', flat=True)),
        'opened_sessions': AuthToken.objects.filter(user=user).count(),
        'detail': 'Token válido'
    })

def custom_logout_view(request):
    logout(request)
    return redirect("/accounts/login/")  # O a donde desees redirigir después del logout

def notLoggedIn(request):
    return JsonResponse({"ok":False,"message": "You are not logged in", "data":[]})

class HelloWord(View):
    def get(self, request):
        return JsonResponse({"ok":True,"message": "Core. Hello world", "data":[]})

class LoginView(View):
    def post(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            username=request.user.username
            return JsonResponse({"ok":True,"message": "The user {0} already is authenticated".format(username), "data":[{'username':request.user.username}]})

        username=request.POST.get('username')
        password=request.POST.get('password')
        user = authenticate(username=username, password=password)
        if user:
            login(request,user)#introduce into the request cookies the session_id,
                    # and in the auth_sessions the session data. This way, 
                    # in followoing requests, know who is the user and if
                    # he is already authenticated. 
                    # The coockies are sent in the response header on POST requests
            return JsonResponse({"ok":True,"message": "User {0} logged in".format(username), "data":[{"username": username}]})
        else:
            # To make thinks difficult to hackers, you make a random delay,
            # between 0 and 1 second
            seconds=random.uniform(0, 1)
            time.sleep(seconds)
            return JsonResponse({"ok":False,"message": "Wrong user or password", "data":[]})

class LogoutView(LoginRequiredMixin, View):
    def post(self, request, *args, **kwargs):
        username=request.user.username
        logout(request) #removes from the header of the request
                            #the the session_id, stored in a cookie
        return JsonResponse({"ok":True,"message": "The user {0} is now logged out".format(username), "data":[]})


class IsLoggedIn(View):
    def post(self, request, *args, **kwargs):
        print(request.user.username)
        print(request.user.is_authenticated)
        if request.user.is_authenticated:
            return JsonResponse({"ok":True,"message": "You are authenticated", "data":[{'username':request.user.username}]})
        else:
            return JsonResponse({"ok":False,"message": "You are not authenticated", "data":[]})
