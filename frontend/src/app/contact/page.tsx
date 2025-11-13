'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, MessageSquare, Send, User, CheckCircle } from 'lucide-react'

export default function ContactPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate form submission
    setTimeout(() => {
      setSubmitted(true)
      setLoading(false)
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false)
        setFormData({ name: '', email: '', subject: '', message: '' })
      }, 3000)
    }, 1000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
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
            <Mail className="h-8 w-8 text-primary" />
            Entre em Contato
          </CardTitle>
          <CardDescription>
            Tem dúvidas, sugestões ou encontrou algum problema? Estamos aqui para ajudar!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h3 className="text-2xl font-semibold">Mensagem Enviada!</h3>
              <p className="text-muted-foreground text-center">
                Obrigado por entrar em contato. Responderemos em breve.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-mail
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Assunto
                </label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="Sobre o que você gostaria de falar?"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Mensagem
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Escreva sua mensagem aqui..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  'Enviando...'
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Mensagem
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t space-y-4">
            <h3 className="font-semibold text-lg">Outras Formas de Contato</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">E-mail para Segurança:</p>
                <a 
                  href="mailto:security@guerreiros-do-segundo-lugar.vercel.app"
                  className="text-primary hover:underline"
                >
                  security@guerreiros-do-segundo-lugar.vercel.app
                </a>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Suporte Geral:</p>
                <a 
                  href="mailto:support@guerreiros-do-segundo-lugar.vercel.app"
                  className="text-primary hover:underline"
                >
                  support@guerreiros-do-segundo-lugar.vercel.app
                </a>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Reportar Vulnerabilidade:</p>
                <p>
                  Se você encontrou uma vulnerabilidade de segurança, por favor nos contate em{' '}
                  <a 
                    href="mailto:security@guerreiros-do-segundo-lugar.vercel.app"
                    className="text-primary hover:underline"
                  >
                    security@guerreiros-do-segundo-lugar.vercel.app
                  </a>
                  {' '}ou consulte nosso{' '}
                  <a 
                    href="/.well-known/security.txt"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    security.txt
                  </a>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
