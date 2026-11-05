import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { type ErrorComponentProps, Link, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { getErrorMessage } from '@/lib/errors'

export function PendingScreen() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
      <Spinner />
      Загрузка…
    </div>
  )
}

export function ErrorScreen({ error }: ErrorComponentProps) {
  const router = useRouter()
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  useEffect(() => {
    queryErrorResetBoundary.reset()
  }, [queryErrorResetBoundary])

  return (
    <div className="grid justify-items-center gap-3 py-16 text-center">
      <p className="font-medium">Не удалось загрузить данные</p>
      <p className="text-muted-foreground text-sm">{getErrorMessage(error)}</p>
      <Button variant="outline" onClick={() => router.invalidate()}>
        Повторить
      </Button>
    </div>
  )
}

export function NotFoundScreen() {
  return (
    <div className="grid justify-items-center gap-3 py-16 text-center">
      <p className="font-medium">Страница не найдена</p>
      <p className="text-muted-foreground text-sm">
        Возможно, её удалили или у вас нет к ней доступа
      </p>
      <Button asChild variant="outline">
        <Link to="/">На главную</Link>
      </Button>
    </div>
  )
}
