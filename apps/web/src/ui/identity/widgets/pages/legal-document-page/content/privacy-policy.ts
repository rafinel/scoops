import type { LegalDocument } from '../types/legal-document'

export const PRIVACY_POLICY: LegalDocument = {
  title: 'Política de Privacidade',
  description:
    'Entenda como os dados pessoais são utilizados no Scoops e como exercer seus direitos.',
  route: 'privacyPolicy',
  version: '0.1 — minuta',
  updatedAt: '11 de outubro de 2026',
  sections: [
    {
      id: 'responsaveis-pelos-dados',
      title: '1. Quem é responsável pelos dados',
      paragraphs: [
        'O responsável pelo Scoops, identificado nesta página, atua como controlador dos dados necessários ao cadastro, à autenticação e à administração do serviço, nos termos da Lei Geral de Proteção de Dados Pessoais (LGPD).',
        'Para dados pessoais inseridos na gestão da equipe e da operação, o estabelecimento define as finalidades e o Scoops atua como operador, conforme instruções legítimas e o contrato. Essa divisão depende da atividade e não afasta as responsabilidades do Scoops.',
      ],
    },
    {
      id: 'dados-tratados',
      title: '2. Quais dados são tratados',
      paragraphs: [
        'Informações empresariais também podem ser dados pessoais quando identificam uma pessoa física.',
        'O escopo atual não inclui cadastro ou histórico dos consumidores da loja. Evite inserir dados sensíveis ou informações pessoais desnecessárias em nomes, descrições e outros campos operacionais.',
      ],
      items: [
        'Conta e equipe: nome, e-mail, informações de autenticação, estabelecimento, perfil, status, sessões e registros de acesso.',
        'Operação: cadastros, receitas, estoque, produção, pedidos e indicadores, incluindo identificação de quem realizou ações e seus horários.',
        'Comunicações: destinatários, mensagens de acesso e operação, notificações internas e estado individual de leitura.',
        'Atendimento e segurança: informações enviadas ao suporte e registros técnicos necessários à análise de falhas, acessos e incidentes.',
        'Na futura contratação paga: titular, CPF/CNPJ, telefone, endereço, e-mail financeiro, referências de pagamento, cobranças, documentos fiscais da assinatura e evidências de aceite, incluindo versão, data, horário e IP.',
      ],
    },
    {
      id: 'finalidades-e-bases-legais',
      title: '3. Para que utilizamos os dados',
      paragraphs: [
        'Utilizamos dados para administrar contas, autenticar pessoas, aplicar permissões, executar funcionalidades, preservar autoria, enviar comunicações necessárias e prestar atendimento. Conforme o contexto, a base legal é a execução de contrato ou de procedimentos preliminares solicitados pelo titular.',
        'Obrigações legais e a defesa de direitos podem fundamentar tratamentos específicos. Segurança e prevenção de abuso podem se apoiar no legítimo interesse, com avaliação de necessidade, impacto e salvaguardas.',
        'Quando atuamos como operador, o estabelecimento é responsável por definir a base legal adequada às suas atividades. Se uma finalidade depender de consentimento, ele será solicitado de forma específica e poderá ser revogado. Aceitar os termos não autoriza usos ilimitados dos dados.',
      ],
    },
    {
      id: 'compartilhamento',
      title: '4. Fornecedores e compartilhamento',
      paragraphs: [
        'Fornecedores apoiam hospedagem, banco de dados, tarefas, e-mails e diagnóstico de falhas. A infraestrutura documentada utiliza Supabase, Inngest, Resend e Sentry. A migração para Hostinger está planejada; a lista final deve refletir os serviços efetivamente utilizados.',
        'Asaas é o fornecedor previsto para a futura cobrança da assinatura. Quando ativado, seu fluxo tratará os dados necessários a pagamentos e obrigações associadas. Não há processamento de pagamentos dos consumidores da loja pelo Scoops.',
        'Dados também podem ser apresentados a profissionais autorizados ou autoridades quando houver obrigação legal ou necessidade de defesa de direitos. O acesso deve ficar limitado à finalidade correspondente.',
      ],
    },
    {
      id: 'cookies-e-transferencias',
      title: '5. Cookies e localização dos dados',
      paragraphs: [
        'Cookies de sessão permitem autenticação e segurança. Bloqueá-los pode impedir o acesso. Diagnósticos podem tratar informações técnicas. PostHog é opcional e depende de ativação, com configuração e base legal verificadas antes do uso. O inventário de cookies, campos coletados e prazos devem ser confirmado antes da publicação final.',
        'Fornecedores podem operar infraestrutura fora do Brasil. Os fornecedores, países de destino e mecanismos de transferência internacional aplicáveis serão detalhados na versão final, após a confirmação da configuração e dos contratos, observadas as exigências da LGPD.',
      ],
    },
    {
      id: 'conservacao-e-seguranca',
      title: '6. Conservação e proteção',
      paragraphs: [
        'Dados devem ser conservados pelo tempo necessário às finalidades informadas, às obrigações legais e ao exercício de direitos. O fim do acesso não apaga imediatamente todos os registros; a conservação deve ser avaliada por categoria.',
        'Inativar uma conta preserva a autoria de ações anteriores. Cancelar a assinatura também não equivale a um pedido de eliminação. Prazos automáticos de descarte operacional e de expiração de cópias de segurança estão em definição e implementação; esta minuta não afirma que esse descarte já ocorre.',
        'O projeto prevê controle de acesso por perfil e isolamento entre estabelecimentos. Medidas técnicas e organizacionais devem acompanhar os riscos do tratamento; nenhum sistema oferece garantia absoluta contra incidentes. Ocorrências serão avaliadas e comunicadas quando exigido pela legislação.',
      ],
    },
    {
      id: 'direitos-e-contato',
      title: '7. Seus direitos e como solicitar',
      paragraphs: [
        'As solicitações são gratuitas. Utilize o contato de privacidade desta página. Podemos confirmar sua identidade de forma proporcional. Dados geridos pelo estabelecimento podem exigir sua participação, sem afastar as obrigações do Scoops.',
        'A eliminação depende da base legal e das exceções de conservação. A ausência de um botão de exclusão não impede solicitações. Prazos legais serão observados e limitações explicadas. Você pode apresentar petição à ANPD e aos órgãos competentes.',
      ],
      items: [
        'Confirmar a existência de tratamento e acessar seus dados.',
        'Corrigir dados incompletos, inexatos ou desatualizados.',
        'Solicitar anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade.',
        'Solicitar portabilidade, observada a regulamentação e os segredos comercial e industrial.',
        'Conhecer compartilhamentos, solicitar a eliminação de dados tratados com consentimento quando aplicável e revogar esse consentimento.',
        'Receber informações sobre a possibilidade de não consentir e as consequências dessa escolha, quando aplicável.',
        'Opor-se a tratamento realizado sem consentimento quando houver descumprimento da legislação.',
        'Solicitar revisão de decisões exclusivamente automatizadas que afetem seus interesses, quando houver esse tratamento.',
      ],
    },
    {
      id: 'atualizacoes',
      title: '8. Atualizações desta política',
      paragraphs: [
        'Esta minuta deverá ser revisada quando o cadastro do responsável, os fornecedores e as práticas efetivas forem confirmados. Alterações relevantes serão comunicadas pelos canais disponíveis, com indicação da versão e da data de atualização.',
      ],
    },
  ],
}
