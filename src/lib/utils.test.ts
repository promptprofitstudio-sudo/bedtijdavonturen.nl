import { expect, test, describe } from 'vitest'
import { cn } from './utils'

describe('utils', () => {
    describe('cn', () => {
        test('should merge classes correctly', () => {
            const result = cn('base-class', 'dynamic-class')
            expect(result).toBe('base-class dynamic-class')
        })

        test('should handle conditional classes', () => {
            const condition = true
            const falseCondition = false
            const result = cn(
                'base',
                condition && 'visible',
                falseCondition && 'hidden',
                null,
                undefined
            )
            expect(result).toBe('base visible')
        })

        test('should return empty string for no inputs', () => {
            expect(cn()).toBe('')
        })
    })
})
