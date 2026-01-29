import { DataSource } from 'typeorm';
import { Plan } from '../../plans/entities/plan.entity';

export class PlansSeeder {
    constructor(private dataSource: DataSource) { }

    async run() {
        console.log('🎯 Criando planos...');

        const planRepository = this.dataSource.getRepository(Plan);

        const planCount = await planRepository.count();
        if (planCount > 0) {
            console.log('📊 Planos já existem. Pulando seed de planos...');
            return;
        }

        const plans = [
            {
                name: 'Básico',
                description: 'Ideal para uso pessoal com recursos essenciais',
                durationType: 'days' as const,
                hours: 30,
                price: 29.90,
                maxConcurrentIps: 2,
                features: ['Acesso a produtos', 'Busca básica', 'Suporte por email'],
                color: '#3B82F6',
                displayOrder: 1,
                isActive: true,
            },
            {
                name: 'Premium',
                description: 'Para uso profissional com recursos avançados',
                durationType: 'days' as const,
                hours: 30,
                price: 59.90,
                maxConcurrentIps: 5,
                features: [
                    'Acesso ilimitado a produtos',
                    'Busca avançada',
                    'Suporte prioritário',
                    'Exportação de dados',
                ],
                color: '#8B5CF6',
                displayOrder: 2,
                isActive: true,
            },
            {
                name: 'Empresa',
                description: 'Solução completa para empresas com múltiplos usuários',
                durationType: 'days' as const,
                hours: 90,
                price: 149.90,
                maxConcurrentIps: 10,
                features: [
                    'Acesso ilimitado a produtos',
                    'Busca avançada',
                    'Suporte 24/7',
                    'Exportação de dados',
                    'API de integração',
                    'Dashboard personalizado',
                ],
                color: '#10B981',
                displayOrder: 3,
                isActive: true,
            },
        ];

        for (const planData of plans) {
            const plan = planRepository.create(planData);
            await planRepository.save(plan);
        }

        console.log('✅ 3 planos criados: Básico (2 IPs), Premium (5 IPs), Empresa (10 IPs)');
    }
}
