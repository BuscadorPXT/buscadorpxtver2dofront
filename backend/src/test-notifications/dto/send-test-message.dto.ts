export class SendTestMessageDto {
  userId: number;
  messageType: '6h_before' | '1h_before' | 'post_test';
  testEndTime: Date;
}
