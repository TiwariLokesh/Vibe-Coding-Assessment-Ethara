import { AlertCircle } from 'lucide-react'

export default function ErrorState({ title = 'Something went wrong', description = 'Please try again.' }) {
  return (
    <div className="rounded-4xl border border-rose-500/20 bg-rose-500/10 p-10 text-center text-rose-100">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/20">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-rose-100/80">{description}</p>
    </div>
  )
}
