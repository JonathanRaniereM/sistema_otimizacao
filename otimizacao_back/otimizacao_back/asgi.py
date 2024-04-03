"""
ASGI config for otimizacao_back project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

# ... o restante do código ASGI, como a configuração dos protocolos e a criação da aplicação final


import os


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'otimizacao_back.settings')

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
django_asgi_app = get_asgi_application()

from channels.auth import AuthMiddlewareStack   
import otimizacao_app.routing


application = ProtocolTypeRouter({
    "http": django_asgi_app,
    'websocket': AuthMiddlewareStack(
        URLRouter(
            otimizacao_app.routing.websocket_urlpatterns
        )
    )
})



