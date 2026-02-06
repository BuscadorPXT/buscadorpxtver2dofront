import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Monitor, Smartphone, Tablet, Trash2 } from 'lucide-react';

const detectDeviceType = (userAgent) => {
    const ua = userAgent.toLowerCase();

    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        return { type: 'mobile', Icon: Smartphone };
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
        return { type: 'tablet', Icon: Tablet };
    }
    return { type: 'desktop', Icon: Monitor };
};

const parseUserAgent = (userAgent) => {

    let browser = 'Desconhecido';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';

    let os = 'Desconhecido';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    return { browser, os };
};

export default function SessionCard({ session, onRemove, isCurrentSession, showUserId = false }) {
    const { type: deviceType, Icon: DeviceIcon } = detectDeviceType(session.userAgent);
    const { browser, os } = parseUserAgent(session.userAgent);
    const lastActivity = formatDistanceToNow(new Date(session.lastActivityAt), {
        addSuffix: true,
        locale: ptBR,
    });

    return (
        <div
            className={`border rounded-lg p-4 ${isCurrentSession ? 'border-blue-500 bg-blue-50' : 'border-neutral-200 bg-white'
                }`}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">

                    <div className={`p-2 rounded-lg ${isCurrentSession ? 'bg-blue-100' : 'bg-neutral-100'}`}>
                        <DeviceIcon className={`w-6 h-6 ${isCurrentSession ? 'text-primary' : 'text-neutral-600'}`} />
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-neutral-900">
                                {os} - {browser}
                            </h3>
                            {isCurrentSession && (
                                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                                    Este dispositivo
                                </span>
                            )}
                        </div>

                        <div className="mt-1 space-y-1">
                            <p className="text-sm text-neutral-600">
                                <span className="font-medium">IP:</span> {session.ipAddress}
                            </p>
                            <p className="text-sm text-neutral-600">
                                <span className="font-medium">Última atividade:</span> {lastActivity}
                            </p>
                            {showUserId && (
                                <p className="text-sm text-neutral-600">
                                    <span className="font-medium">User ID:</span> {session.userId}
                                </p>
                            )}
                        </div>

                        <details className="mt-2">
                            <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-700">
                                Ver detalhes técnicos
                            </summary>
                            <p className="text-xs text-neutral-500 mt-1 break-all">{session.userAgent}</p>
                        </details>
                    </div>
                </div>

                <button
                    onClick={() => onRemove(session.id)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remover acesso"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
