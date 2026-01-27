import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger = new Logger('WebsocketGateway');
    private userSockets = new Map<string, string>(); // userId -> socketId

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        // Remove from userSockets
        for (const [userId, socketId] of this.userSockets.entries()) {
            if (socketId === client.id) {
                this.userSockets.delete(userId);
                break;
            }
        }
    }

    @SubscribeMessage('register')
    handleRegister(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string },
    ) {
        this.userSockets.set(data.userId, client.id);
        this.logger.log(`User registered: ${data.userId}`);
        return { success: true };
    }

    @SubscribeMessage('message')
    handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any,
    ) {
        this.logger.log(`Message from ${client.id}: ${JSON.stringify(data)}`);

        // Broadcast to receiver
        const receiverSocketId = this.userSockets.get(data.receiverId);
        if (receiverSocketId) {
            this.server.to(receiverSocketId).emit('message:received', data);
        }

        return { success: true };
    }

    // Utility methods to send notifications
    sendNotification(userId: string, notification: any) {
        const socketId = this.userSockets.get(userId);
        if (socketId) {
            this.server.to(socketId).emit('notification:new', notification);
        }
    }

    sendApplicationUpdate(userId: string, application: any) {
        const socketId = this.userSockets.get(userId);
        if (socketId) {
            this.server.to(socketId).emit('application:status', application);
        }
    }

    sendMilestoneUpdate(userId: string, milestone: any) {
        const socketId = this.userSockets.get(userId);
        if (socketId) {
            this.server.to(socketId).emit('milestone:update', milestone);
        }
    }
}
