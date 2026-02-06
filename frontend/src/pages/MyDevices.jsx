import { AlertCircle, RefreshCw, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import SessionCard from '../components/SessionCard';
import sessionsService from '../services/sessions.service';

export default function MyDevices() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [removing, setRemoving] = useState(null);

    const [currentIp, setCurrentIp] = useState(null);

    useEffect(() => {
        loadSessions();

        fetch('https://api.ipify.org?format=json')
            .then((res) => res.json())
            .then((data) => setCurrentIp(data.ip))
            .catch(() => setCurrentIp(null));
    }, []);

    const loadSessions = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await sessionsService.getMySessions();
            setSessions(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao carregar dispositivos');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveSession = async (sessionId) => {
        if (!confirm('Deseja realmente desconectar este dispositivo?')) {
            return;
        }

        try {
            setRemoving(sessionId);
            await sessionsService.removeMySession(sessionId);
            setSessions(sessions.filter((s) => s.id !== sessionId));
        } catch (err) {
            alert(err.response?.data?.message || 'Erro ao remover sessão');
        } finally {
            setRemoving(null);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="w-8 h-8 animate-spin text-neutral-600" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">

            <div className="mb-8">
                <div className="flex items-center space-x-3 mb-2">
                    <Smartphone className="w-8 h-8 text-neutral-900 dark:text-neutral-100" />
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Meus Dispositivos</h1>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">
                    Gerencie os dispositivos conectados à sua conta. Você pode desconectar dispositivos que não
                    reconhece ou que não está mais usando.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-red-900 dark:text-red-300">Erro ao carregar dispositivos</h3>
                        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                    </div>
                </div>
            )}

            <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Dispositivos conectados</p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{sessions.length}</p>
                    </div>
                    <button
                        onClick={loadSessions}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                        title="Atualizar"
                    >
                        <RefreshCw className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                    </button>
                </div>
            </div>

            {sessions.length >= 2 && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-yellow-900 dark:text-yellow-300">Atenção</h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                            Você está próximo do limite de dispositivos do seu plano. Se tentar fazer login de um novo
                            dispositivo, pode ser necessário desconectar um dos existentes.
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {sessions.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <Smartphone className="w-16 h-16 text-neutral-400 dark:text-neutral-500 mx-auto mb-4" />
                        <p className="text-neutral-600 dark:text-neutral-400">Nenhum dispositivo conectado</p>
                    </div>
                ) : (
                    sessions.map((session) => (
                        <SessionCard
                            key={session.id}
                            session={session}
                            onRemove={handleRemoveSession}
                            isCurrentSession={currentIp && session.ipAddress === currentIp}
                        />
                    ))
                )}
            </div>

            <div className="mt-8 p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Sobre os dispositivos</h3>
                <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                    <li>• Cada dispositivo é identificado pelo seu endereço IP</li>
                    <li>• Desconectar um dispositivo força o logout naquele aparelho</li>
                    <li>• A última atividade é atualizada automaticamente quando você usa o sistema</li>
                    <li>• Sessões inativas por mais de 24 horas são removidas automaticamente</li>
                </ul>
            </div>
        </div>
    );
}
