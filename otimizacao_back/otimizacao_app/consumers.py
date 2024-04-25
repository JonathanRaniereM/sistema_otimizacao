# consumers.py

from channels.db import database_sync_to_async
from djangochannelsrestframework import permissions
from djangochannelsrestframework.generics import GenericAsyncAPIConsumer
from djangochannelsrestframework.mixins import (
    ListModelMixin,
    CreateModelMixin,
    UpdateModelMixin,
    DeleteModelMixin,
    RetrieveModelMixin,
)

import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from rest_framework.renderers import JSONRenderer


# Configure o logger
logger = logging.getLogger(__name__)

specificStatusCodeMappings = {
    '1000': 'Normal Closure',
    '1001': 'Going Away',
    '1002': 'Protocol Error',
    '1003': 'Unsupported Data',
    '1004': '(For future)',
    '1005': 'No Status Received',
    '1006': 'Abnormal Closure',
    '1007': 'Invalid frame payload data',
    '1008': 'Policy Violation',
    '1009': 'Message too big',
    '1010': 'Missing Extension',
    '1011': 'Internal Error',
    '1012': 'Service Restart',
    '1013': 'Try Again Later',
    '1014': 'Bad Gateway',
    '1015': 'TLS Handshake'
}

def getStatusCodeString(code):
    if code is None:
        return "Código de status desconhecido"
    if (code >= 0 and code <= 999):
        return '(Unused)'
    elif (code >= 1016):
        if (code <= 1999):
            return '(For WebSocket standard)'
        elif (code <= 2999):
            return '(For WebSocket extensions)'
        elif (code <= 3999):
            return '(For libraries and frameworks)'
        elif (code <= 4999):
            return '(For applications)'
    return specificStatusCodeMappings.get(code, '(Unknown)')

import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer

logger = logging.getLogger(__name__)

class OtimizeConsumer(AsyncJsonWebsocketConsumer):
    
    async def connect(self):
        logger.info("Conexão estabelecida.")
        print("Método connect chamado!")
        
        # Verificar se reuniao_id está na URL. Se não, definir um padrão (por exemplo, "global").
        reuniao_id = self.scope['url_route']['kwargs'].get('reuniao_id', 'global')
        
        self.room_group_name = f"presenca_{reuniao_id}"
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        self.accept()
        await super().connect()
        logger.info(f"Conexão estabelecida. Conectado ao grupo {self.room_group_name}.")

    async def disconnect(self, close_code):
        status_message = getStatusCodeString(close_code)
        logger.info(f"Desconexão com código: {close_code} - {status_message}")
        await self.channel_layer.group_discard(
            self.room_group_name,  # use a variável de nome de grupo dinâmico
            self.channel_name
        )
        await super().disconnect(close_code)

    async def receive_json(self, content, **kwargs):
        action = content.get('action')
        logger.info(f"Recebido: {content}")
        if action == 'optimize':
            await self.perform_optimization(content)
        if action == 'optimize_all':
            await self.perform_optimization_all(content)
        else:
            logger.warning(f"Ação desconhecida recebida: {action}")

    async def perform_optimization(self, content):
        type = content['type']
        method = content['method']
        data = content['data']
        logger.info(f"Iniciando otimização com método: {method}, dados: {data}")
        
        from .optimization import method_random_and_method_gradient

        if method == 'random':
            result = await database_sync_to_async(method_random_and_method_gradient)(data)
      
        else:
            result = {'error': 'Método de otimização desconhecido'}
            logger.error(f"Método de otimização desconhecido: {method}")

        response = {
            'type': type,
            'method': method,
            'data': data,
            'result': result
        }
        
        logger.info(f"Enviando resultado da otimização: {response}")
        await self.send_json(response)


    async def perform_optimization_all(self, content):
        type = content['type']
        method = content['method']
        data = content['data']
        logger.info(f"Iniciando otimização com método: {method}, dados: {data}")

        from .optimization import method_random_and_method_gradient

        if method == 'random':
            result = await database_sync_to_async(method_random_and_method_gradient)(data)
        else:
            result = {'error': 'Método de otimização desconhecido'}
            logger.error(f"Método de otimização desconhecido: {method}")

        response = {
            'type': type,
            'method': method,
            'data': data,
            'result': result
        }

        logger.info(f"Enviando resultado da otimização para todos no grupo: {self.room_group_name}")
        # Enviar a resposta para todos no grupo
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'perform_optimization_update',  # Este é o método handler no consumer que vai tratar a mensagem
                'message': response
            }
        )

        
    async def perform_optimization_update(self, event):
        # Extrai a mensagem de 'event' que foi enviada pelo 'group_send'
        message = event['message']
        logger.info(f"Repassando mensagem ao grupo: {message}")
        await self.send_json(message)

        
        
    async def send_json(self, content, close=False):
        logger.info(f"Enviando mensagem: {content}")
        await super().send_json(content, close=close)
