import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class EncryptionService {
  private readonly secretKey = process.env.ENCRYPTION_KEY || 'your-secret-encryption-key-change-in-production-2024';
  private readonly encryptionEnabled = process.env.ENABLE_ENCRYPTION !== 'false';

  constructor() {
    console.log('🔑 Encryption Service - Status:', this.encryptionEnabled ? '✅ ATIVADA' : '⚠️  DESATIVADA (DEV MODE)');
    if (this.encryptionEnabled) {
      console.log('🔑 Chave carregada:', this.secretKey ? `Sim (tamanho: ${this.secretKey.length} chars)` : 'Não - usando fallback');
    }
  }

  encrypt(data: any): string {
    if (!this.encryptionEnabled) {
      console.log('⚠️  Criptografia desativada - retornando JSON direto');
      return JSON.stringify(data);
    }

    const jsonString = JSON.stringify(data);
    console.log('🔒 Criptografando dados...', {
      dataType: typeof data,
      jsonLength: jsonString.length,
      jsonSample: jsonString.substring(0, 100) + '...',
      keyLength: this.secretKey.length
    });
    
    const encrypted = CryptoJS.AES.encrypt(jsonString, this.secretKey).toString();
    
    console.log('✅ Criptografia bem-sucedida', {
      encryptedLength: encrypted.length,
      encryptedSample: encrypted.substring(0, 50) + '...'
    });
    
    return encrypted;
  }

  decrypt(encryptedData: string): any {
    if (!this.encryptionEnabled) {
      console.log('⚠️  Criptografia desativada - fazendo parse direto do JSON');
      return JSON.parse(encryptedData);
    }

    const decrypted = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(jsonString);
  }
}
