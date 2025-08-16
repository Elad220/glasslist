import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GoogleSignInButton from '@/components/GoogleSignInButton'

describe('GoogleSignInButton - Core Functionality', () => {
  const mockOnSignIn = vi.fn()

  beforeEach(() => {
    mockOnSignIn.mockClear()
  })

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<GoogleSignInButton onSignIn={mockOnSignIn} />)
      
      const button = screen.getByRole('button', { name: /continue with google/i })
      expect(button).toBeInTheDocument()
      expect(button).not.toBeDisabled()
    })

    it('should render Google logo', () => {
      render(<GoogleSignInButton onSignIn={mockOnSignIn} />)
      
      const logo = screen.getByRole('button').querySelector('svg')
      expect(logo).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<GoogleSignInButton onSignIn={mockOnSignIn} className="custom-class" />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('Loading States', () => {
    it('should show loading state when isLoading is true', () => {
      render(<GoogleSignInButton onSignIn={mockOnSignIn} isLoading={true} />)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(screen.getByText(/signing in with google/i)).toBeInTheDocument()
      
      // Should show spinner
      const spinner = button.querySelector('.spinner')
      expect(spinner).toBeInTheDocument()
    })

    it('should show loading state during click processing', async () => {
      const user = userEvent.setup()
      
      // Mock a slow async function
      mockOnSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<GoogleSignInButton onSignIn={mockOnSignIn} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Should show loading state immediately after click
      expect(button).toBeDisabled()
      expect(screen.getByText(/signing in with google/i)).toBeInTheDocument()
      
      // Wait for async operation to complete
      await waitFor(() => {
        expect(button).not.toBeDisabled()
      })
    })
  })

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<GoogleSignInButton onSignIn={mockOnSignIn} disabled={true} />)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should not call onSignIn when disabled', async () => {
      const user = userEvent.setup()
      
      render(<GoogleSignInButton onSignIn={mockOnSignIn} disabled={true} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(mockOnSignIn).not.toHaveBeenCalled()
    })
  })

  describe('Click Handling', () => {
    it('should call onSignIn when clicked', async () => {
      const user = userEvent.setup()
      
      render(<GoogleSignInButton onSignIn={mockOnSignIn} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(mockOnSignIn).toHaveBeenCalledTimes(1)
    })

    it('should handle onSignIn errors gracefully', async () => {
      const user = userEvent.setup()
      
      mockOnSignIn.mockRejectedValue(new Error('Sign-in failed'))
      
      render(<GoogleSignInButton onSignIn={mockOnSignIn} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Button should return to normal state after error
      await waitFor(() => {
        expect(button).not.toBeDisabled()
        expect(screen.getByText(/continue with google/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper button role', () => {
      render(<GoogleSignInButton onSignIn={mockOnSignIn} />)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should have descriptive button text', () => {
      render(<GoogleSignInButton onSignIn={mockOnSignIn} />)
      
      expect(screen.getByText(/continue with google/i)).toBeInTheDocument()
    })

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      
      render(<GoogleSignInButton onSignIn={mockOnSignIn} />)
      
      const button = screen.getByRole('button')
      
      // Focus the button
      await user.tab()
      expect(button).toHaveFocus()
      
      // Press Enter to activate
      await user.keyboard('{Enter}')
      expect(mockOnSignIn).toHaveBeenCalledTimes(1)
    })
  })

  describe('Visual States', () => {
    it('should show correct text in normal state', () => {
      render(<GoogleSignInButton onSignIn={mockOnSignIn} />)
      
      expect(screen.getByText(/continue with google/i)).toBeInTheDocument()
    })

    it('should show correct text in loading state', () => {
      render(<GoogleSignInButton onSignIn={mockOnSignIn} isLoading={true} />)
      
      expect(screen.getByText(/signing in with google/i)).toBeInTheDocument()
    })

    it('should have proper CSS classes', () => {
      render(<GoogleSignInButton onSignIn={mockOnSignIn} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('glass-button')
      expect(button).toHaveClass('bg-white')
      expect(button).toHaveClass('hover:bg-gray-50')
    })
  })
})