import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const NotificationModal = ({ notification, isOpen, onClose, onMarkAsRead }) => {
  if (!notification) return null;

  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{notification.title}</DialogTitle>
          <DialogDescription>
            {new Date(notification.createdAt).toLocaleString('pt-BR', {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {notification.imageUrl && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={notification.imageUrl}
                alt="Anexo da notificação"
                className="w-full h-auto max-h-96 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{

                a: ({ node, ...props }) => (
                  <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600" />
                ),

                img: ({ node, ...props }) => (
                  <img {...props} className="rounded-lg max-w-full h-auto" />
                ),

                code: ({ node, inline, ...props }) => (
                  inline ? (
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props} />
                  ) : (
                    <code className="block bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto" {...props} />
                  )
                ),
              }}
            >
              {notification.message}
            </ReactMarkdown>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {!notification.isRead && (
            <Button onClick={handleMarkAsRead} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar como Lida
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationModal;
