import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express'; 
import { Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
    // Enable CORS for frontend connection
    app.enableCors({ origin: '*' });

    // Access the underlying Express instance
    const expressApp = app.getHttpAdapter().getInstance();
  
    // Serve static files from React build folder
    expressApp.use(express.static(join(__dirname, '..', 'public')));
  
    expressApp.get(/.*/, (req: Request, res: Response) => {
      res.sendFile(join(__dirname, '..', 'public', 'index.html'));
    });
      
  
  await app.listen(process.env.PORT || 3000);
  console.log(`🚀 Application is running on: http://localhost:${process.env.PORT || 3000}`);
}
bootstrap();
