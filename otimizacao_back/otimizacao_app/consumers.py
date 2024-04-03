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

class OtimizeConsumer(
    GenericAsyncAPIConsumer
):   
    
    

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


   
    import logging

    logger = logging.getLogger(__name__)

    async def perform_optimization(self, content):
        from .optimization import random_method, newton_method, quasi_newton_method, barrier_method
        
        method = content['method']
        data = content['data']
        logger.info(f"Iniciando otimização com método: {method}, dados: {data}")
        
        if method == 'random':
            logger.info("Entrando no método 'random'")
            result = await database_sync_to_async(random_method)(data)
            logger.info("Saindo do método 'random'")
        elif method == 'newton':
            result = await database_sync_to_async(newton_method)(data)
        elif method == 'quasi_newton':
            result = await database_sync_to_async(quasi_newton_method)(data)
        elif method == 'barrier':
            result = await database_sync_to_async(barrier_method)(data)
        else:
            result = {'error': 'Método de otimização desconhecido'}
            logger.error(f"Método de otimização desconhecido: {method}")
        
        try:
            message = {
                'type': "perform_optimization", 
                'method': method,   
                'data': data,
                'result': result,
            }
            await self.channel_layer.group_send(self.room_group_name, message)
        except Exception as e:
            logger.error(f"Erro ao processar atualização de cronômetro com conteúdo: {content}. Erro: {str(e)}")

           

   
    async def perform_optimization_update(self, event):
        await self.send_json({
            'type': event['type'],
            'method': event['method'],
            'data': event['data'],
            'result': event['result'],
        })
        
        
        
    async def delete(self, content):
  
        try:

            message = {
                'type': 'delete.update',   
                'data': 'delete.update',
    
            }
            await self.channel_layer.group_send(self.room_group_name, message)
        except Exception as e:
            logger.error(f"Erro ao processar atualização de cronometro com conteúdo: {content}. Erro: {str(e)}")

    async def delete_update(self, event):
        await self.send_json({
            'type': event['type'],
            'data': event['data'],
       
        })
        


    # Adicione este método
    async def send_json(self, content, close=False):
        try:
            logger.info(f"Preparando para enviar mensagem para o grupo {self.room_group_name}. Mensagem: {content}")
            await super().send_json(content, close)
            logger.info(f"Mensagem enviada com sucesso para o grupo {self.room_group_name}. ")
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem para o grupo {self.room_group_name}. . Erro: {str(e)}")




    async def receive_json(self, content, **kwargs):
        action = content.get('action')
        if action == 'optimize':
            await self.perform_optimization(content)
        elif action == 'delete':
            await self.delete(content)

        else:
            await super().receive_json(content, **kwargs)
            



