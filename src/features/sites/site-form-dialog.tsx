import { zodResolver } from '@hookform/resolvers/zod'
import { type ReactElement, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { type Site, useSaveSite } from '@/features/sites/api'

const siteSchema = z.object({
  name: z.string().trim().min(1, 'Укажите название').max(200, 'Не длиннее 200 символов'),
  address: z.string().trim().min(1, 'Укажите адрес').max(300, 'Не длиннее 300 символов'),
})

type SiteFormDialogProps = {
  trigger: ReactElement
  site?: Site
}

export function SiteFormDialog({ trigger, site }: SiteFormDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{site ? 'Редактирование объекта' : 'Новый объект'}</DialogTitle>
          <DialogDescription>Название и адрес стройки</DialogDescription>
        </DialogHeader>
        <SiteForm site={site} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

function SiteForm({ site, onSaved }: { site?: Site; onSaved: () => void }) {
  const saveSite = useSaveSite()
  const form = useForm({
    resolver: zodResolver(siteSchema),
    defaultValues: { name: site?.name ?? '', address: site?.address ?? '' },
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((values) =>
    saveSite.mutate(
      { siteId: site?.id, values },
      {
        onSuccess: () => {
          toast.success(site ? 'Объект сохранён' : 'Объект создан')
          onSaved()
        },
      },
    ),
  )

  return (
    <form className="grid gap-4" noValidate onSubmit={onSubmit}>
      <Field>
        <FieldLabel htmlFor="site-name">Название</FieldLabel>
        <Input id="site-name" aria-invalid={Boolean(errors.name)} {...form.register('name')} />
        <FieldError>{errors.name?.message}</FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="site-address">Адрес</FieldLabel>
        <Input
          id="site-address"
          aria-invalid={Boolean(errors.address)}
          {...form.register('address')}
        />
        <FieldError>{errors.address?.message}</FieldError>
      </Field>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Отмена</Button>
        </DialogClose>
        <Button type="submit" disabled={saveSite.isPending}>
          {site ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogFooter>
    </form>
  )
}
