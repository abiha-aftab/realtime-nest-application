import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  
  @WebSocketGateway({ cors: { origin: '*' } })
  export class DataGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
  
    afterInit(server: Server) {
      console.log('Gateway initialized');
      // Optional: start simulated data
      this.startSimulatedData();
    }
  
    handleConnection(client: Socket) {
      console.log('Client connected:', client.id);
    }
  
    handleDisconnect(client: Socket) {
      console.log('Client disconnected:', client.id);
    }
  
    @SubscribeMessage('newData')
    handleNewData(client: Socket, payload: any) {
      const processed = this.processData(payload);
      if (processed) {
        // emit to all clients
        this.server.emit('processedData', processed);
      }
      // optionally send ack back to sender
      return { status: 'received' };
    }
  
    processData(payload: any) {
      // Example processing/filter:
      // require payload.value to exist and be > 50
      if (!payload || typeof payload.value !== 'number') return null;
      if (payload.value <= 50) return null; // filtered out
      return {
        ...payload,
        processedAt: new Date().toISOString(),
        severity: payload.value > 80 ? 'high' : 'normal',
      };
    }
  
    startSimulatedData() {
      setInterval(() => {
        const value = Math.floor(Math.random() * 100);
        const payload = { value, source: 'simulator' };
        const processed = this.processData(payload);
        if (processed) this.server.emit('processedData', processed);
      }, 2000); // every 2s
    }
  }
  