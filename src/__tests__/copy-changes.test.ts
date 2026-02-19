import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Copy Audit Fixes - File Content Verification', () => {
  describe('Fix #1: Homepage Copy', () => {
    it('should contain Apollo\'s proposed copy in homepage', () => {
      const homepagePath = path.resolve(__dirname, '../../app/page.tsx')
      const content = fs.readFileSync(homepagePath, 'utf-8')
      
      expect(content).toContain('Een nieuw slaapverhaal, klaar voordat je koffie afkoelt. Echt.')
      expect(content).not.toContain('Binnen 10 seconden een magisch slaapverhaal')
    })
  })

  describe('Fix #2: Pricing CTA Buttons', () => {
    it('should have Weekend button with new CTA text', () => {
      const pricingPath = path.resolve(__dirname, '../../app/pricing/page.tsx')
      const content = fs.readFileSync(pricingPath, 'utf-8')
      
      expect(content).toContain('Start Now — 3 Stories for €2.99')
      expect(content).not.toContain('Koop 3x Rust')
    })

    it('should have Monthly button with new CTA text', () => {
      const pricingPath = path.resolve(__dirname, '../../app/pricing/page.tsx')
      const content = fs.readFileSync(pricingPath, 'utf-8')
      
      expect(content).toContain('Try Free for 7 Days')
      expect(content).not.toContain('Kies Basis')
    })

    it('should have Family button with new CTA text', () => {
      const pricingPath = path.resolve(__dirname, '../../app/pricing/page.tsx')
      const content = fs.readFileSync(pricingPath, 'utf-8')
      
      expect(content).toContain('Unlock Family Plan')
      expect(content).not.toContain('Kies Family')
    })
  })

  describe('Consistency Fixes: Time References', () => {
    it('should show correct loading message with 60 seconds', () => {
      const loaderPath = path.resolve(__dirname, '../../components/ProgressiveLoader.tsx')
      const content = fs.readFileSync(loaderPath, 'utf-8')
      
      expect(content).toContain('Dit duurt ongeveer 60 seconden')
      expect(content).not.toContain('Dit duurt ongeveer 10 seconden')
    })

    it('should maintain 60 seconds in wizard', () => {
      const wizardPath = path.resolve(__dirname, '../../app/wizard/page.tsx')
      const content = fs.readFileSync(wizardPath, 'utf-8')
      
      expect(content).toContain('60 seconden')
    })
  })
})
