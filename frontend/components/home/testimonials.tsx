import { Quote, Star } from 'lucide-react'

const TESTIMONIALS = [
  {
    name: 'Amira B.',
    location: 'Alger',
    text: 'The emerald ring is even more beautiful in person. Ordering was so simple and the team confirmed everything on WhatsApp within minutes.',
  },
  {
    name: 'Lina K.',
    location: 'Oran',
    text: 'I bought the bridal set for my wedding and received so many compliments. The quality feels truly luxurious.',
  },
  {
    name: 'Sara M.',
    location: 'Constantine',
    text: 'Fast delivery and gorgeous packaging. The pearl necklace has become my everyday favourite.',
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
