import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface User {
  email: string
  name?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("authToken")
    const userEmail = localStorage.getItem("userEmail")
    
    if (token && userEmail) {
      setUser({ email: userEmail })
    }
    
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For demo purposes, accept any email/password
      if (email && password) {
        const userData = { email }
        setUser(userData)
        localStorage.setItem("authToken", "demo-token")
        localStorage.setItem("userEmail", email)
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("authToken")
    localStorage.removeItem("userEmail")
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

