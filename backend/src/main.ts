import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:5173'];
  
  console.log('🔧 [Main] Configuring CORS for HTTP and WebSocket...');
  console.log('🔧 [Main] Allowed origins:', allowedOrigins);

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');

  const url = await app.getUrl();
  console.log(`🚀 Nest backend listening at ${url} (port ${port})`);
  console.log(`✅ CORS enabled for origins: ${allowedOrigins.join(', ')}`);
}
bootstrap();
