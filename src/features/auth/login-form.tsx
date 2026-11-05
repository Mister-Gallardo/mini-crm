import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { signIn } from '@/features/auth/api'
import { getErrorMessage } from '@/lib/errors'

const loginSchema = z.object({
  email: z.email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

export function LoginForm() {
  const navigate = useNavigate()
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    try {
      await signIn(email, password)
      await navigate({ to: '/' })
    } catch (error) {
      form.setError('root', { message: getErrorMessage(error) })
    }
  })

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Вход</CardTitle>
        <CardDescription>Объекты и задачи строительной компании</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" noValidate onSubmit={onSubmit}>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              aria-invalid={Boolean(errors.email)}
              {...form.register('email')}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Пароль</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...form.register('password')}
            />
            <FieldError>{errors.password?.message}</FieldError>
          </Field>
          <FieldError>{errors.root?.message}</FieldError>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Входим…' : 'Войти'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
