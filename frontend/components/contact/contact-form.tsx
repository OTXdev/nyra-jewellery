"use client"

import { useState } from "react"
import { Check, Send } from "lucide-react"
import { createContactMessage, ApiError } from "@/lib/api"

export function ContactForm() {
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" })

  if (sent) {
    return (
      <div className="rounded-3xl border border-accent/40 bg-accent/10 p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-6" />
        </div>
        <h3 className="mt-4 font-serif text-xl">Message envoyé</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Merci de nous avoir contactés. Nous vous répondrons dès que possible.
        </p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await createContactMessage({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        subject: form.subject || "Formulaire de contact du site",
        message: form.message,
      })
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom complet">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Téléphone (facultatif)">
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </Field>
        <Field label="Sujet">
          <input
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </Field>
      </div>
      <Field label="Message">
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </Field>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        <Send className="size-4" /> {submitting ? "Envoi…" : "Envoyer le message"}
      </button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}
