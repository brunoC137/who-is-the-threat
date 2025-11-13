'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Mail } from 'lucide-react'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Política de Privacidade
          </CardTitle>
          <CardDescription>
            Última atualização: {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Introdução
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Bem-vindo ao Guerreiros do Segundo Lugar. Esta política de privacidade explica como coletamos, 
              usamos, compartilhamos e protegemos suas informações pessoais quando você usa nossa plataforma 
              de rastreamento de jogos de Commander (EDH).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Informações que Coletamos
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Informações de Conta:</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Nome e apelido (nickname)</li>
                  <li>Endereço de e-mail</li>
                  <li>Senha (criptografada com bcrypt)</li>
                  <li>Imagem de perfil (URL, opcional)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Informações de Uso:</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Decks criados e gerenciados</li>
                  <li>Jogos registrados e seus resultados</li>
                  <li>Estatísticas de desempenho</li>
                  <li>Datas e horários de atividades</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Como Usamos Suas Informações
            </h2>
            <div className="text-muted-foreground space-y-2">
              <p>Utilizamos suas informações para:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Fornecer e manter os serviços da plataforma</li>
                <li>Autenticar e autorizar seu acesso</li>
                <li>Exibir estatísticas e histórico de jogos</li>
                <li>Permitir interação com outros jogadores do seu grupo</li>
                <li>Melhorar e personalizar sua experiência</li>
                <li>Comunicar atualizações importantes do serviço</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Segurança dos Dados
            </h2>
            <div className="text-muted-foreground space-y-2">
              <p>Implementamos medidas de segurança robustas, incluindo:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Criptografia de senhas com bcrypt (12 rounds)</li>
                <li>Autenticação via JWT (JSON Web Tokens)</li>
                <li>Conexões HTTPS obrigatórias</li>
                <li>Headers de segurança HTTP (HSTS, CSP, X-Frame-Options)</li>
                <li>Rate limiting para prevenir abuso</li>
                <li>Validação rigorosa de dados de entrada</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Compartilhamento de Informações
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros. 
              Seus dados são visíveis apenas para outros usuários do seu grupo de jogadores dentro 
              da plataforma, conforme necessário para o funcionamento do serviço (ex: nome, nickname, 
              decks e estatísticas de jogos).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Seus Direitos</h2>
            <div className="text-muted-foreground space-y-2">
              <p>Você tem o direito de:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Acessar suas informações pessoais</li>
                <li>Corrigir dados incorretos ou desatualizados</li>
                <li>Solicitar a exclusão de sua conta e dados</li>
                <li>Exportar seus dados em formato legível</li>
                <li>Retirar consentimento para processamento de dados</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Cookies e Tecnologias Similares</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies essenciais para autenticação e manutenção de sessão. 
              Estes cookies são necessários para o funcionamento da plataforma e não podem 
              ser desativados. Não utilizamos cookies de rastreamento ou publicidade.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Retenção de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mantemos suas informações pessoais enquanto sua conta estiver ativa ou conforme 
              necessário para fornecer os serviços. Você pode solicitar a exclusão de sua conta 
              a qualquer momento, e seus dados serão removidos dentro de 30 dias.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Alterações nesta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta política de privacidade periodicamente. Notificaremos você 
              sobre mudanças significativas publicando a nova política nesta página e atualizando 
              a data de "Última atualização" no topo.
            </p>
          </section>

          <section className="border-t pt-6">
            <h2 className="text-2xl font-semibold mb-3 flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Contato
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Se você tiver dúvidas ou preocupações sobre esta política de privacidade ou sobre 
              como tratamos seus dados pessoais, entre em contato conosco através da{' '}
              <Button
                variant="link"
                className="p-0 h-auto font-semibold"
                onClick={() => router.push('/contact')}
              >
                página de contato
              </Button>
              .
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
