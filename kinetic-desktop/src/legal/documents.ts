/**
 * Termos de Uso e Política de Privacidade, publicados em /termos e /privacidade
 * (o app abre estas páginas). Mudou o texto? Troque LEGAL_VERSION aqui e
 * legal.terms-version no backend: quem aceitou a versão anterior aceita de novo.
 * Prazos e bases legais conferem com RETENCAO-DE-DADOS.md, na raiz do repositório.
 */

export const LEGAL_VERSION = '2026-10-25';
export const LEGAL_UPDATED_AT = '25 de outubro de 2026';
export const PRIVACY_CONTACT = 'privacidade@kineticfitness.com.br';
/** Razão social e CNPJ do controlador: preencher ao constituir a empresa (aparecem nas duas páginas). */
export const CONTROLLER_NAME = 'Kinetic';
export const CONTROLLER_CNPJ: string | null = null;

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  items?: string[];
  table?: { head: string[]; rows: string[][] };
}

export interface LegalDocument {
  title: string;
  summary: string;
  sections: LegalSection[];
}

const controller = CONTROLLER_CNPJ ? `${CONTROLLER_NAME}, CNPJ ${CONTROLLER_CNPJ}` : CONTROLLER_NAME;

export const PRIVACY_POLICY: LegalDocument = {
  title: 'Política de Privacidade',
  summary:
    'Quais dados o Kinetic usa, para quê, com quem compartilha, por quanto tempo guarda e como você exerce os seus direitos (Lei 13.709/2018, a LGPD).',
  sections: [
    {
      title: '1. Quem trata os seus dados',
      paragraphs: [
        `O controlador dos dados é ${controller}. Dúvidas e pedidos sobre os seus dados: ${PRIVACY_CONTACT} (canal do encarregado de dados).`,
        'O personal trainer que acompanha você também decide sobre os dados que registra no Kinetic (avaliações físicas, protocolo de treino, mensalidades). Nesses dados, o Kinetic trata as informações em nome dele.',
      ],
    },
    {
      title: '2. Quais dados usamos',
      items: [
        'Cadastro: nome, e-mail, celular, senha (guardada só em forma criptografada, que ninguém consegue ler) e, para personal trainers, CPF, CREF e chave Pix.',
        'Dados de saúde e treino (dados sensíveis): data de nascimento, peso, altura, objetivo, frequência, nível, condições médicas e lesões informadas, fichas, treinos registrados, séries e cargas, avaliações físicas e anamnese.',
        'Comunidade: fotos, posts, stories, comentários, curtidas e conexões com outros usuários.',
        'Relação com o personal: vínculo, mensalidades e pagamentos registrados por ele, avaliações que você faz do atendimento.',
        'Assinatura do personal: plano, situação e identificadores no meio de pagamento.',
        'Registros de acesso: endereço IP e data e hora de uso, exigidos pelo Marco Civil da Internet.',
      ],
    },
    {
      title: '3. Para que usamos e com que base legal',
      table: {
        head: ['Finalidade', 'Base legal (LGPD)'],
        rows: [
          ['Criar e manter a sua conta, montar e acompanhar treinos, ligar você ao seu personal', 'Execução do contrato (art. 7º, V)'],
          ['Tratar dados de saúde para montar e acompanhar os treinos', 'Consentimento específico e destacado no cadastro (art. 11, I)'],
          ['Gerar sugestões de ficha com inteligência artificial', 'Execução do contrato e consentimento (arts. 7º, V e 11, I)'],
          ['Guardar registros de acesso por 6 meses', 'Obrigação legal: Marco Civil da Internet, art. 15 (art. 7º, II)'],
          ['Guardar registros financeiros e fiscais', 'Obrigação legal (arts. 7º, II e 16, I)'],
          ['Guardar a prova de quem prescreveu uma ficha aprovada por IA', 'Exercício regular de direitos em processo (arts. 7º, VI e 11, II, d)'],
          ['Segurança, prevenção a fraude e abuso', 'Legítimo interesse (art. 7º, IX) e prevenção à fraude (art. 11, II, g)'],
        ],
      },
    },
    {
      title: '4. Com quem compartilhamos',
      items: [
        'Seu personal trainer vinculado: vê o seu perfil de treino, histórico e avaliações enquanto o vínculo estiver ativo.',
        'Outros usuários: só o que você publica na comunidade, conforme a visibilidade escolhida.',
        'Fornecedores que operam o serviço em nosso nome, sob contrato e só para esta finalidade: hospedagem do banco de dados e arquivos (Supabase), rede e segurança (Cloudflare), envio de e-mails (Resend), pagamentos da assinatura do personal (Asaas) e o provedor de inteligência artificial que gera sugestões de ficha.',
        'Para a inteligência artificial vão só idade, peso, altura, objetivo, nível, frequência e as condições médicas informadas, sem nome, e-mail ou celular.',
        'Autoridades, apenas por ordem judicial ou obrigação legal.',
        'Alguns desses fornecedores guardam dados fora do Brasil. Nesses casos, a transferência segue o art. 33 da LGPD, com garantias contratuais de proteção.',
        'Não vendemos dados pessoais.',
      ],
    },
    {
      title: '5. Por quanto tempo guardamos',
      paragraphs: [
        'Enquanto a conta existir, guardamos o necessário para o serviço funcionar. Ao excluir a conta, os dados são apagados na hora, exceto o que a lei exige guardar, sempre sem acesso pelo aplicativo e com prazo para sumir:',
      ],
      table: {
        head: ['O que fica', 'Por quanto tempo', 'Por quê'],
        rows: [
          ['IP e data e hora dos acessos, com nome, e-mail, CPF e celular para identificá-los', '6 meses', 'Marco Civil da Internet, arts. 15 e 22'],
          ['Pagamentos de mensalidade já recebidos pelo seu personal (só o seu nome, valor e data)', 'Até 31/12 do 6º ano após o pagamento', 'Registro fiscal do personal (CTN, art. 173)'],
          ['Fichas aprovadas por IA: declaração do personal, pedido e ficha aprovada (você identificado só por um código)', '5 anos após a aprovação', 'Defesa em eventual processo (CDC, art. 27)'],
          ['Versão e data do aceite destes termos, e identificadores no meio de pagamento (personal)', '5 anos', 'Prova do consentimento e obrigações financeiras'],
          ['Cópias de segurança do banco de dados', 'Até a expiração da cópia (dias)', 'Recuperação em caso de falha'],
        ],
      },
    },
    {
      title: '6. Seus direitos',
      items: [
        'Confirmar se tratamos seus dados e acessá-los: em Perfil → Baixar meus dados, você recebe uma cópia completa.',
        'Corrigir dados incompletos ou errados, pelo próprio aplicativo.',
        'Levar seus dados para outro serviço (portabilidade): a cópia é entregue em formato aberto (JSON).',
        'Excluir a conta e os dados, a qualquer momento, pelo aplicativo ou pelo painel.',
        'Revogar o consentimento: excluir a conta encerra o tratamento dos seus dados de saúde.',
        'Saber com quem compartilhamos e pedir revisão de decisões automatizadas.',
        `Para qualquer outro pedido: ${PRIVACY_CONTACT}. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).`,
      ],
    },
    {
      title: '7. Como protegemos',
      items: [
        'Conexão sempre criptografada (HTTPS) e senhas guardadas com criptografia que não pode ser revertida.',
        'O servidor não fica exposto na internet: o acesso passa pela rede de proteção da Cloudflare.',
        'Cada pessoa só acessa o que é dela; o personal só vê alunos com vínculo ativo.',
        'Os registros guardados depois da exclusão da conta não ficam acessíveis pelo aplicativo e usam códigos no lugar do e-mail sempre que possível.',
        'Em caso de incidente de segurança com risco a você, comunicamos você e a ANPD (art. 48).',
      ],
    },
    {
      title: '8. Cookies',
      paragraphs: [
        'O painel usa só um cookie necessário para manter você conectado com segurança. Não usamos cookies de publicidade nem de rastreamento.',
      ],
    },
    {
      title: '9. Crianças e adolescentes',
      paragraphs: [
        'O Kinetic é destinado a maiores de 18 anos. Adolescentes só podem usar com autorização e acompanhamento do responsável legal.',
      ],
    },
    {
      title: '10. Mudanças nesta política',
      paragraphs: [
        'Quando esta política mudar, avisamos no aplicativo e pedimos um novo aceite antes de continuar. A data da versão vigente fica no topo desta página.',
      ],
    },
  ],
};

export const TERMS_OF_USE: LegalDocument = {
  title: 'Termos de Uso',
  summary: 'As regras para usar o Kinetic, o aplicativo do aluno e o painel do personal trainer.',
  sections: [
    {
      title: '1. O serviço',
      paragraphs: [
        `O Kinetic, oferecido por ${controller}, é uma plataforma em que personal trainers acompanham seus alunos: fichas de treino, registro de treinos, avaliações, comunidade e controle de mensalidades. O aplicativo do aluno é gratuito; o personal paga uma assinatura pelo painel.`,
        'Ao criar a conta, você declara ter lido e aceito estes Termos e a Política de Privacidade.',
      ],
    },
    {
      title: '2. Sua conta',
      items: [
        'Você precisa ter 18 anos ou mais, ou autorização do responsável legal.',
        'Os dados informados devem ser verdadeiros. Você é responsável por manter sua senha em segredo e pelo que for feito com a sua conta.',
        'O personal trainer declara ter registro ativo no CREF e ser o responsável técnico pelos treinos que prescreve.',
      ],
    },
    {
      title: '3. Treinos, saúde e inteligência artificial',
      items: [
        'O Kinetic é uma ferramenta: não presta serviço de educação física nem de saúde. A prescrição e o acompanhamento dos treinos são do personal trainer.',
        'Fichas sugeridas por inteligência artificial são um ponto de partida. Antes de chegarem ao aluno, o personal revisa e assume a prescrição; o aluno sem personal usa a sugestão por conta própria.',
        'Antes de começar ou mudar a rotina de exercícios, consulte um médico. Informe ao seu personal lesões, doenças e restrições, e pare o treino se sentir dor ou mal-estar.',
      ],
    },
    {
      title: '4. Pagamentos',
      items: [
        'As mensalidades entre aluno e personal são combinadas e pagas diretamente entre os dois. O Kinetic só ajuda o personal a registrar e acompanhar; não cobra nem recebe esses valores.',
        'A assinatura do personal é cobrada pelo meio de pagamento informado no painel, conforme o plano escolhido. O personal pode cancelar quando quiser; o acesso pago vale até o fim do período já pago.',
      ],
    },
    {
      title: '5. Comunidade e conteúdo',
      items: [
        'Você é responsável pelo que publica. Não é permitido publicar conteúdo ilegal, ofensivo, discriminatório, sexual, de terceiros sem autorização ou que exponha dados de outras pessoas.',
        'Ao publicar, você permite que o Kinetic exiba o conteúdo dentro da plataforma, conforme a visibilidade escolhida, enquanto ele estiver publicado.',
        'Podemos remover conteúdo e suspender ou bloquear contas que descumpram estas regras.',
      ],
    },
    {
      title: '6. Encerramento',
      paragraphs: [
        'Você pode excluir sua conta a qualquer momento pelo aplicativo ou pelo painel. A exclusão é imediata e definitiva; fica guardado só o que a lei exige, pelos prazos da Política de Privacidade. Antes de excluir, você pode baixar uma cópia dos seus dados.',
      ],
    },
    {
      title: '7. Responsabilidades',
      items: [
        'Trabalhamos para manter o serviço disponível e seguro, mas ele pode passar por interrupções para manutenção ou por falhas de terceiros.',
        'O Kinetic não responde pela prescrição de treinos feita pelo personal nem pelo uso de sugestões sem acompanhamento profissional, nos limites da lei.',
        'Nada nestes Termos afasta os direitos garantidos pelo Código de Defesa do Consumidor.',
      ],
    },
    {
      title: '8. Mudanças e foro',
      paragraphs: [
        'Quando estes Termos mudarem, avisamos no aplicativo e pedimos um novo aceite antes de continuar.',
        'Vale a lei brasileira. Para consumidores, o foro é o do seu domicílio.',
        `Contato: ${PRIVACY_CONTACT}.`,
      ],
    },
  ],
};
