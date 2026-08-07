import { Quote, Star } from 'lucide-react'

const TESTIMONIALS = [
  {
    name: 'Amira B.',
    location: 'Alger',
    text: 'La bague émeraude est encore plus belle en vrai. Commander était très simple et l’équipe a tout confirmé sur WhatsApp en quelques minutes.',
  },
  {
    name: 'Lina K.',
    location: 'Oran',
    text: 'J’ai acheté l’ensemble de mariée pour mon mariage et j’ai reçu énormément de compliments. La qualité est vraiment luxueuse.',
  },
  {
    name: 'Sara M.',
    location: 'Constantine',
    text: 'Livraison rapide et emballage magnifique. Le collier de perles est devenu mon favori du quotidien.',
  },
]

export function Testimonials() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {TESTIMONIALS.map((t) => (
        <figure
          key={t.name}
          className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <Quote className="size-8 text-accent" />
          <div className="flex gap-0.5 text-accent">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-4 fill-current" />
            ))}
          </div>
          <blockquote className="flex-1 text-pretty leading-relaxed text-foreground/90">
            “{t.text}”
          </blockquote>
          <figcaption className="text-sm">
            <span className="font-medium text-foreground">{t.name}</span>
            <span className="text-muted-foreground"> · {t.location}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
