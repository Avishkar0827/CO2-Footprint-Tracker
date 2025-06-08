"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { LeafyGreen, Menu, X, LogOut, User } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"

interface NavItem {
  href: string
  label: string
  protected?: boolean
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  // Base nav items that are always visible
  const baseNavItems: NavItem[] = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    // Add Calculator here so it's always visible
    { href: "/calculator", label: "Calculator", protected: true }
  ]

  // Nav items that are only visible when logged in
  const authNavItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard" }
  ]

  // Combine nav items based on auth status
  const navItems: NavItem[] = [
    ...baseNavItems,
    ...(user ? authNavItems : [])
  ]

  const handleProtectedNavigation = (href: string, protectedRoute: boolean = false) => {
    if (protectedRoute && !user) {
      router.push('/login')
      return
    }
    router.push(href)
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-sm border-b"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <LeafyGreen className="h-8 w-8 text-green-600" />
            <span className="font-bold text-2xl">CO2 Ninja</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleProtectedNavigation(item.href, item.protected)}
                className="text-lg text-gray-600 hover:text-gray-900 font-medium"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="flex items-center space-x-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
            ) : user ? (
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-medium text-gray-700">
                    {user.name}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-11 w-11 rounded-full p-0">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-green-600 text-white">
                            {user.name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                     
                      <DropdownMenuItem 
                        onClick={logout}
                        className="text-red-600 focus:text-red-600"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="text-lg h-11 px-6">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-green-600 hover:bg-green-700 text-lg h-11 px-6">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button 
            className="md:hidden p-2" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-white border-b"
        >
          <div className="container mx-auto px-4 py-4 space-y-4">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => {
                  handleProtectedNavigation(item.href, item.protected)
                  setIsMenuOpen(false)
                }}
                className="block text-lg text-gray-600 hover:text-gray-900 py-3 w-full text-left"
              >
                {item.label}
              </button>
            ))}
            <div className="flex flex-col space-y-4 pt-2">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full rounded-md" />
                  <Skeleton className="h-12 w-full rounded-md" />
                </div>
              ) : user ? (
                <>
                  <div className="flex items-center space-x-3 px-4 py-2">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-green-600 text-white">
                        {user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-lg font-medium">{user.name}</span>
                  </div>
                  <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                    
                  </Link>
                  <Button 
                    onClick={() => {
                      logout()
                      setIsMenuOpen(false)
                    }}
                    variant="destructive"
                    className="w-full text-lg h-12"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full text-lg h-12">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-lg h-12">
                      Sign up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}