import { AlertCircle, ArrowLeft, RefreshCw, Shield, Trash2, TrendingUp, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SessionCard from '../components/SessionCard';
import sessionsService from '../services/sessions.service';

export default function AdminUserSessions() {
    const { userId } = useParams();
    const navigate = useNavigate();

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [removing, setRemoving] = useState(null);

    useEffect(() => {
        loadSessions();
    }, [userId]);

    const loadSessions = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await sessionsService.getUserSessions(userId);
            setSessions(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao carregar sessões');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveSession = async (sessionId) => {
        if (!confirm('Deseja realmente remover esta sessão? O usuário será desconectado deste dispositivo.')) {
            return;
        }

        try {
            setRemoving(sessionId);
            await sessionsService.removeUserSession(userId, sessionId);
            setSessions(sessions.filter((s) => s.id !== sessionId));
        } catch (err) {
            alert(err.response?.data?.message || 'Erro ao remover sessão');
        } finally {
            setRemoving(null);
        }
    };

    const handleRemoveAllSessions = async () => {
        if (
            !confirm(
                `Deseja realmente remover TODAS as sessões deste usuário?\n\nO usuário será desconectado de todos os dispositivos e precisará fazer login novamente.`
            )
        ) {
            return;
        }

        try {
            setRemoving('all');
            const result = await sessionsService.removeAllUserSessions(userId);
            setSessions([]);
            alert(result.message || 'Todas as sessões foram removidas');
        } catch (err) {
            alert(err.response?.data?.message || 'Erro ao remover sessões');
        } finally {
            setRemoving(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50">
                <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <RefreshCw className="w-12 h-12 animate-spin text-neutral-400 mx-auto mb-4" />
                            <p className="text-neutral-600">Carregando sessões...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

                <div className="mb-6 sm:mb-8">
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-900 mb-6"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Voltar para usuários</span>
                    </button>

                    <div className="bg-white rounded-lg shadow border border-neutral-200 p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-neutral-100 rounded-lg">
                                    <Shield className="w-8 h-8 text-neutral-700" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
                                        Sessões do Usuário
                                    </h1>
                                    <p className="text-sm text-neutral-500 mt-1">User ID: <span className="font-medium text-neutral-700">#{userId}</span></p>
                                </div>
                            </div>

                            {sessions.length > 0 && (
                                <button
                                    onClick={handleRemoveAllSessions}
                                    disabled={removing === 'all'}
                                    className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-neutral-400 disabled:cursor-not-allowed"
                                >
                                    {removing === 'all' ? (
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-5 h-5" />
                                    )}
                                    <span className="hidden sm:inline">Remover Todas</span>
                                    <span className="sm:hidden">Remover</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-red-900">Erro ao carregar sessões</h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-lg shadow border border-neutral-200">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-neutral-600">Sessões Ativas</p>
                            <Wifi className="w-5 h-5 text-neutral-400" />
                        </div>
                        <p className="text-3xl font-bold text-neutral-900">{sessions.length}</p>
                        <p className="text-xs text-neutral-500 mt-1">dispositivo{sessions.length !== 1 ? 's' : ''} conectado{sessions.length !== 1 ? 's' : ''}</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow border border-neutral-200">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-neutral-600">IPs Únicos</p>
                            <TrendingUp className="w-5 h-5 text-neutral-400" />
                        </div>
                        <p className="text-3xl font-bold text-neutral-900">
                            {new Set(sessions.map((s) => s.ipAddress)).size}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">endereço{new Set(sessions.map((s) => s.ipAddress)).size !== 1 ? 's' : ''} diferente{new Set(sessions.map((s) => s.ipAddress)).size !== 1 ? 's' : ''}</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow border border-neutral-200 sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between h-full">
                            <div>
                                <p className="text-sm text-neutral-600">Atualizar dados</p>
                                <p className="text-xs text-neutral-500 mt-1">Recarregar lista</p>
                            </div>
                            <button
                                onClick={loadSessions}
                                className="p-3 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                                title="Atualizar lista"
                            >
                                <RefreshCw className="w-6 h-6 text-neutral-700" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {sessions.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-lg shadow border border-neutral-200">
                            <div className="p-4 bg-neutral-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                                <Shield className="w-10 h-10 text-neutral-400" />
                            </div>
                            <p className="text-lg font-semibold text-neutral-900 mb-2">Nenhuma sessão ativa</p>
                            <p className="text-sm text-neutral-500">O usuário não está conectado em nenhum dispositivo</p>
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <SessionCard
                                key={session.id}
                                session={session}
                                onRemove={handleRemoveSession}
                                isCurrentSession={false}
                                showUserId={false}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
