import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VoiceRecorder } from './VoiceRecorder'

// Mock server action
vi.mock('@/app/actions/voice', () => ({
    cloneVoiceAction: vi.fn().mockResolvedValue({ success: true })
}))

// Mock MediaRecorder
const mockMediaRecorder = {
    start: vi.fn(),
    stop: vi.fn(),
    ondataavailable: null as ((event: BlobEvent) => void) | null,
    onerror: null,
    state: 'inactive',
    stream: {
        getTracks: () => [{ stop: vi.fn() }] // Mock stream track stop
    }
}

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
        getUserMedia: vi.fn().mockResolvedValue({
            getTracks: () => [{ stop: vi.fn() }]
        }),
    },
    writable: true
})

// Setup MediaRecorder constructor mock
global.MediaRecorder = vi.fn(() => mockMediaRecorder) as any
global.URL.createObjectURL = vi.fn(() => 'blob:url')

// @ts-ignore
global.BlobEvent = class extends Event {
    data: Blob;
    constructor(type: string, props: { data: Blob }) {
        super(type);
        this.data = props.data;
    }
}


describe('VoiceRecorder', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders idle state correctly', () => {
        render(<VoiceRecorder userId="test-user" />)
        expect(screen.getByText(/Start Opname/i)).toBeTruthy()
    })

    it('starts recording when "Start" is clicked', async () => {
        render(<VoiceRecorder userId="test-user" />)

        fireEvent.click(screen.getByText(/Start Opname/i))

        await waitFor(() => {
            expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
            expect(mockMediaRecorder.start).toHaveBeenCalled()
            expect(screen.getByText(/Stop Opname/i)).toBeTruthy()
        })
    })

    it('stops recording and shows upload button', async () => {
        render(<VoiceRecorder userId="test-user" />)

        // Start
        fireEvent.click(screen.getByText(/Start Opname/i))
        await waitFor(() => expect(screen.getByText(/Stop Opname/i)).toBeTruthy())

        // Stop
        fireEvent.click(screen.getByText(/Stop Opname/i))

        // Simulate data available event
        if (mockMediaRecorder.ondataavailable) {
            const blob = new Blob(['mock audio'], { type: 'audio/webm' })
            mockMediaRecorder.ondataavailable(new BlobEvent('dataavailable', { data: blob }))
        }

        await waitFor(() => {
            expect(mockMediaRecorder.stop).toHaveBeenCalled()
            expect(screen.getByText(/Verstuur/i)).toBeTruthy()
            expect(screen.getByText(/Opnieuw/i)).toBeTruthy()
        })
    })
})
