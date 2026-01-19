/**
 * Landing Page - TaxBook Pro
 * Refined Financial Aesthetic
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Feature data
const features = [
  {
    icon: CalendarIcon,
    title: 'Smart Scheduling',
    description: 'AI-powered appointment booking that syncs with your calendar and respects your availability preferences.',
  },
  {
    icon: UsersIcon,
    title: 'Client Management',
    description: 'Organize client information, track interactions, and maintain detailed records effortlessly.',
  },
  {
    icon: FileTextIcon,
    title: 'Document Hub',
    description: 'Secure document collection and organization with automated reminders and status tracking.',
  },
  {
    icon: ClockIcon,
    title: 'Time Tracking',
    description: 'Track billable hours accurately with integrated timers and detailed reporting.',
  },
  {
    icon: ShieldIcon,
    title: 'Bank-Level Security',
    description: 'Your data is protected with end-to-end encryption and SOC 2 compliant infrastructure.',
  },
  {
    icon: TrendingUpIcon,
    title: 'Practice Insights',
    description: 'Understand your business with analytics on client retention, revenue, and growth trends.',
  },
];

const stats = [
  { value: '10,000+', label: 'Tax Professionals' },
  { value: '2.5M', label: 'Appointments Booked' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9/5', label: 'Customer Rating' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-pattern opacity-40 pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                <BookOpenIcon className="h-5 w-5" />
              </div>
              <span className="text-xl font-display font-semibold text-foreground">
                TaxBook Pro
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Testimonials
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="shadow-lg shadow-primary/20">
                <Link href="/signup">
                  Start Free Trial
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="animate-fade-up stagger-1 mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-medium text-primary">
                Trusted by 10,000+ tax professionals
              </span>
            </div>

            {/* Headline */}
            <h1 className="animate-fade-up stagger-2 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Smart Scheduling for{' '}
              <span className="text-gradient">Tax Professionals</span>
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-up stagger-3 mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
              Streamline your tax practice with intelligent scheduling, client management,
              and document organization. Spend less time on admin, more time on clients.
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-up stagger-4 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto px-8 py-6 text-base shadow-xl shadow-primary/20 hover-lift">
                <Link href="/signup">
                  Start Your Free Trial
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-base">
                <Link href="#demo">
                  <PlayIcon className="mr-2 h-5 w-5" />
                  Watch Demo
                </Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <p className="animate-fade-up stagger-5 mt-8 text-sm text-muted-foreground">
              No credit card required · 14-day free trial · Cancel anytime
            </p>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="animate-fade-up stagger-6 mt-16 sm:mt-20">
            <div className="relative mx-auto max-w-5xl">
              {/* Decorative elements */}
              <div className="absolute -top-4 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />

              {/* Dashboard preview card */}
              <div className="relative rounded-2xl border border-border/50 bg-card shadow-2xl shadow-primary/10 overflow-hidden">
                <div className="border-b border-border/50 bg-muted/30 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                    <div className="w-3 h-3 rounded-full bg-accent/60" />
                    <div className="w-3 h-3 rounded-full bg-primary/60" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-md bg-background text-xs text-muted-foreground">
                      app.taxbookpro.com/dashboard
                    </div>
                  </div>
                </div>
                <div className="aspect-[16/9] bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
                  <div className="text-center p-8">
                    <CalendarIcon className="h-16 w-16 mx-auto text-primary/40 mb-4" />
                    <p className="text-muted-foreground">Dashboard Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={stat.label} className={`text-center animate-fade-up stagger-${index + 1}`}>
                <div className="font-display text-3xl sm:text-4xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to run your practice
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features designed specifically for tax professionals,
              so you can focus on what matters most—your clients.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`group relative rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover-lift animate-fade-up stagger-${(index % 6) + 1}`}
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 sm:py-32 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Loved by tax professionals
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              See why thousands of practitioners trust TaxBook Pro for their practice.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                quote: "TaxBook Pro has transformed how I manage my practice. Scheduling used to take hours—now it's completely automated.",
                author: "Sarah Chen, CPA",
                role: "Chen Tax Advisory",
              },
              {
                quote: "The document collection feature alone has saved me countless hours. Clients upload directly, and everything is organized automatically.",
                author: "Michael Torres, EA",
                role: "Torres Tax Services",
              },
              {
                quote: "Finally, software built by people who understand tax professionals. The attention to detail is remarkable.",
                author: "Jennifer Walsh, CPA",
                role: "Walsh & Partners",
              },
            ].map((testimonial, index) => (
              <div
                key={testimonial.author}
                className={`relative rounded-2xl border border-border/50 bg-card p-8 animate-fade-up stagger-${index + 1}`}
              >
                <QuoteIcon className="h-8 w-8 text-primary/20 mb-4" />
                <p className="text-foreground leading-relaxed mb-6">
                  "{testimonial.quote}"
                </p>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 sm:px-16 sm:py-24">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 rounded-full bg-white/10 blur-3xl" />

            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                Ready to modernize your tax practice?
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80">
                Join thousands of tax professionals who've streamlined their workflow with TaxBook Pro.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto px-8 py-6 text-base shadow-xl">
                  <Link href="/signup">
                    Start Your Free Trial
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto px-8 py-6 text-base text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                  <Link href="/login">
                    Sign In
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <BookOpenIcon className="h-5 w-5" />
              </div>
              <span className="text-xl font-display font-semibold text-foreground">
                TaxBook Pro
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
              <Link href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</Link>
              <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            </div>

            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} TaxBook Pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// ICON COMPONENTS
// ============================================================

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  );
}
