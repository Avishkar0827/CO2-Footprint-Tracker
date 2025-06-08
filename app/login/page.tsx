"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { useAuth } from "@/context/AuthContext"

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await login(formData.email, formData.password)
      
      if (result.success) {
        toast.success('Logged in successfully!')
        router.push('/dashboard')
      } else {
        if (result.message?.includes('No account found')) {
          toast.error(result.message, {
            duration: 4000,
            position: 'top-center',
            style: {
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca'
            }
          })
          setTimeout(() => router.push(`/signup?email=${encodeURIComponent(formData.email)}`), 2000)
        } else {
          toast.error(result.message || 'Invalid credentials. Please try again.')
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                />
              </div>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Sign in'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <Link 
                href={`/signup${formData.email ? `?email=${encodeURIComponent(formData.email)}` : ''}`}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Don't have an account? Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}