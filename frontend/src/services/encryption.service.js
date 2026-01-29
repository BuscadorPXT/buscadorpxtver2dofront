import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'your-secret-key-min-32-chars-long-for-aes256';
const ENCRYPTION_ENABLED = import.meta.env.VITE_ENABLE_ENCRYPTION !== 'false';

console.log('🔑 Encryption Service - Status:', ENCRYPTION_ENABLED ? '✅ ATIVADA' : '⚠️  DESATIVADA (DEV MODE)');
if (ENCRYPTION_ENABLED) {
  console.log('🔑 Chave carregada:', SECRET_KEY ? 'Sim (tamanho: ' + SECRET_KEY.length + ' chars)' : 'Não - usando fallback');
}

class EncryptionService {
  
  decrypt(encryptedData) {
    try {
      if (!ENCRYPTION_ENABLED) {
        console.log('⚠️  Criptografia desativada - fazendo parse direto do JSON');
        return JSON.parse(encryptedData);
      }

      console.log('🔓 Tentando descriptografar dados...', {
        dataType: typeof encryptedData,
        dataLength: encryptedData?.length,
        dataSample: encryptedData?.substring(0, 50) + '...',
        keyLength: SECRET_KEY.length
      });
      
      const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      
      console.log('✅ Descriptografia bem-sucedida', {
        decryptedLength: decryptedString.length,
        decryptedSample: decryptedString.substring(0, 100) + '...'
      });
      
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('❌ Erro ao descriptografar dados:', error);
      throw new Error('Falha ao descriptografar os dados');
    }
  }

  encrypt(data) {
    try {
      const jsonString = JSON.stringify(data);
      
      if (!ENCRYPTION_ENABLED) {
        console.log('⚠️  Criptografia desativada - retornando JSON direto');
        return jsonString;
      }

      return CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    } catch (error) {
      console.error('Erro ao criptografar dados:', error);
      throw new Error('Falha ao criptografar os dados');
    }
  }
}

export default new EncryptionService();
