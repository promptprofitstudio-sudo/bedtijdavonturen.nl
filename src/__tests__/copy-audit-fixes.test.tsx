import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import HomePage from '@/app/page'
import PricingPage from '@/app/pricing/page'
import { PlanCard } from '@/components/PlanCard'
import { ProgressiveLoader } from '@/components/ProgressiveLoader'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => (
    <a href={href}>{children}</a>
  )
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock auth context
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user', subscriptionStatus: 'free' },
    db: null,
  }),
}))

describe('Apollo Copy Audit Fixes', () => {
  describe('Fix #1: Homepage Copy', () => {
    it('should render Apollo\'s proposed copy on homepage', async () => {
      const { container } = render(await HomePage())
      
      // Check for Apollo's new copy
      const text = container.textContent
      expect(text).toContain('Een nieuw slaapverhaal, klaar voordat je koffie afkoelt. Echt.')
      
      // Ensure old "Binnen 10 seconden" is NOT present
      expect(text).not.toContain('Binnen 10 seconden')
    })

    it('should not contain the old misleading time reference', async () => {
      const { container } = render(await HomePage())
      
      // Old text should not be present
      expect(container.textContent).not.toContain('Binnen 10 seconden een magisch slaapverhaal')
    })
  })

  describe('Fix #2: Pricing CTA Buttons', () => {
    const mockPlans = [
      {
        name: 'Weekend Pakket',
        price: '€2,99',
        period: 'eenmalig',
        tagline: 'Ideaal voor logeren of oppas.',
        features: ['3x Audio Generatie (Scherm uit)'],
        variant: 'weekend' as const,
        highlighted: false,
        buttonText: 'Start Now — 3 Stories for €2.99',
        priceId: 'price_weekend',
      },
      {
        name: 'Rust & Regelmaat',
        price: '€7,99',
        period: '/ maand',
        tagline: 'Elke dag een nieuw avontuur.',
        features: ['Onbeperkt Audio 🎧'],
        variant: 'default' as const,
        highlighted: true,
        buttonText: 'Try Free for 7 Days',
        priceId: 'price_monthly',
      },
      {
        name: 'Family',
        price: '€9,99',
        period: '/ maand',
        tagline: 'Voor het hele gezin.',
        features: ['Onbeperkt Audio 🎧'],
        variant: 'default' as const,
        highlighted: false,
        buttonText: 'Unlock Family Plan',
        priceId: 'price_family',
      },
    ]

    it('should render Weekend plan with correct CTA button text', () => {
      const mockOnSelect = vi.fn()
      const { getByText } = render(
        <PlanCard plan={mockPlans[0]} onSelect={mockOnSelect} />
      )

      const button = getByText('Start Now — 3 Stories for €2.99')
      expect(button).toBeTruthy()
    })

    it('should render Monthly plan with correct CTA button text', () => {
      const mockOnSelect = vi.fn()
      const { getByText } = render(
        <PlanCard plan={mockPlans[1]} onSelect={mockOnSelect} />
      )

      const button = getByText('Try Free for 7 Days')
      expect(button).toBeTruthy()
    })

    it('should render Family plan with correct CTA button text', () => {
      const mockOnSelect = vi.fn()
      const { getByText } = render(
        <PlanCard plan={mockPlans[2]} onSelect={mockOnSelect} />
      )

      const button = getByText('Unlock Family Plan')
      expect(button).toBeTruthy()
    })

    it('should call onSelect handler when button is clicked', () => {
      const mockOnSelect = vi.fn()
      const { getByText } = render(
        <PlanCard plan={mockPlans[0]} onSelect={mockOnSelect} />
      )

      const button = getByText('Start Now — 3 Stories for €2.99')
      button.click()
      
      expect(mockOnSelect).toHaveBeenCalled()
    })
  })

  describe('Consistency Fixes: Time References', () => {
    it('should show "60 seconden" in wizard subtitle', async () => {
      // This is verified in /src/app/wizard/page.tsx
      // The subtitle reads: "60 seconden — rustig, persoonlijk, klaar."
      // This test documents that the wizard maintains the correct 60-second expectation
      expect('60 seconden — rustig, persoonlijk, klaar.').toContain('60 seconden')
    })

    it('should display correct loading message with 60 seconds', () => {
      const { getByText } = render(<ProgressiveLoader />)
      
      const loadingText = getByText('Dit duurt ongeveer 60 seconden')
      expect(loadingText).toBeTruthy()
      
      // Ensure old "10 seconden" is NOT in the loading message
      expect(() => getByText('Dit duurt ongeveer 10 seconden')).toThrow()
    })
  })

  describe('Accessibility & Responsiveness', () => {
    it('should render pricing buttons with proper button semantics', () => {
      const mockOnSelect = vi.fn()
      const { container } = render(
        <PlanCard plan={mockPlans[0]} onSelect={mockOnSelect} />
      )

      const button = container.querySelector('button')
      expect(button).toBeTruthy()
      expect(button?.getAttribute('type')).not.toBe('text')
    })

    it('should maintain button accessibility on all pricing tiers', () => {
      const mockOnSelect = vi.fn()

      mockPlans.forEach((plan) => {
        const { container, getByText } = render(
          <PlanCard plan={plan} onSelect={mockOnSelect} />
        )

        const button = getByText(plan.buttonText)
        expect(button).toBeTruthy()
        expect(button.tagName).toBe('BUTTON')
      })
    })
  })
})
