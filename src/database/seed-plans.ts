import { database } from "./connection";
import { schema } from "./schemas";

async function seedPlans() {
  console.log('🌱 Começando a semear os planos...');

  await database.delete(schema.plan)

  const plans = [
    {
      name: 'Hobby',
      slug: 'hobby',
      storageLimitBytes: 10 * 1024 * 1024 * 1024, // 10 GB
      priceInCents: '0', // Plano grátis é zero centavos
      description: 'Perfeito para testar a plataforma, projetos acadêmicos ou pequenos experimentos.',
      features: [
        'Até 10 GB de armazenamento',
        'Limite de 50 GB de tráfego mensal',
        'Marca d\'água discreta no player',
        'Suporte via comunidade'
      ]
    },
    {
      name: 'Pro',
      slug: 'pro',
      storageLimitBytes: 100 * 1024 * 1024 * 1024, // 100 GB
      stripeProductId: 'prod_UAhQMbScSdzIcx',
      stripePriceId: 'price_1TCM1DBgSLEj4SBOLlTM4qws',
      priceInCents: '5999', // R$ 59,99
      description: 'Para criadores de conteúdo, infoprodutores e startups dando os primeiros passos.',
      features: [
        'Até 100 GB de armazenamento',
        'Limite de 500 GB de tráfego mensal',
        'Player 100% White-label (sem marca)',
        'Até 300 minutos de IA por mês',
        'Suporte prioritário por e-mail'
      ]
    },
    {
      name: 'Scale',
      slug: 'scale',
      storageLimitBytes: 500 * 1024 * 1024 * 1024, // 500 GB
      stripeProductId: 'prod_UAhTlZYbFIH3bH',
      stripePriceId: 'price_1TCM4IBgSLEj4SBOcsLilsNV',
      priceInCents: '19999', // R$ 199,99
      description: 'Para plataformas de ensino e empresas operando vídeos em alto volume.',
      features: [
        'Até 500 GB de armazenamento',
        'Limite de 2 TB de tráfego mensal',
        'Acesso completo via API Rest',
        'Domínio customizado no player'
      ]
    }
  ];

  for (const plan of plans) {
    await database
      .insert(schema.plan)
      .values(plan)
      .onConflictDoNothing({ target: schema.plan.slug });

    console.log(`✅ Plano ${plan.name} inserido com sucesso!`);
  }

  console.log('🏁 Seed concluído!');
  process.exit(0);
}

seedPlans().catch((err) => {
  console.error('❌ Erro ao semear planos:', err);
  process.exit(1);
});