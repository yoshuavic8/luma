'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card'
import { signIn, signInWithGoogle, handleGoogleRedirectResult } from '@/lib/auth'
import { getAuth } from 'firebase/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [useRedirect, setUseRedirect] = useState(false)
  const router = useRouter()

  // Check for redirect result and existing auth when the component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check if we have a redirect result
        const user = await handleGoogleRedirectResult()
        if (user) {
          console.log('Login: Redirect result found, navigating to home-screen')
          router.push('/home-screen')
          return
        }

        // Then check if user is already logged in
        const auth = getAuth()
        if (auth.currentUser) {
          console.log('Login: User already logged in, navigating to home-screen')
          router.push('/home-screen')
          return
        }

        console.log('Login: No authenticated user found')
      } catch (err) {
        console.error('Login: Error checking auth:', err)
        setError('Failed to complete sign-in. Please try again.')
      }
    }

    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signIn(email, password)
      router.push('/home-screen')
    } catch (err: any) {
      // Removed console statement
      setError(err.message || 'Failed to login. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')

    try {
      // Removed console statement
      await signInWithGoogle(useRedirect)

      // If using redirect, we won't reach this point as the page will reload
      if (!useRedirect) {
        // Removed console statement
        router.push('/home-screen')
      }
    } catch (err: any) {
      // Removed console statement
      // Show a more user-friendly error message
      if (err.message.includes('popup-closed-by-user') || err.message.includes('Login canceled')) {
        setError('Login was canceled. Please try again.')
      } else if (err.message.includes('popup-blocked')) {
        setError('Popup was blocked. Try the alternative sign-in method below.')
        setUseRedirect(true)
      } else if (err.message.includes('network-request-failed')) {
        setError('Network error. Please check your internet connection and try again.')
      } else {
        setError(err.message || 'Failed to login with Google. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // We don't need a separate function for redirect sign-in
  // as we're using the useRedirect parameter in handleGoogleSignIn

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <h1 className="text-2xl font-bold">Luma</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Login to your account</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-500">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remember" className="text-sm text-gray-600">
                  Remember me
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google {useRedirect ? '(Redirect)' : '(Popup)'}
              </Button>

              {useRedirect && (
                <div className="mt-2 text-center text-sm">
                  <p className="text-gray-600">Using redirect method due to popup blocker</p>
                </div>
              )}
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link href="/register" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
