/**
 * Authentication Service
 * Handles user registration, login, JWT management
 */

import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { createClient } from "@supabase/supabase-js"

interface User {
  id: string
  email: string
  password?: string
  name: string
  role: string
  subscriptionTier: string
  provider?: string
  providerId?: string
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export class AuthService {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  private jwtSecret = process.env.JWT_SECRET || "your-secret-key"
  private refreshSecret = process.env.JWT_REFRESH_SECRET || "your-refresh-secret"

  /**
   * Register a new user
   */
  async register(userData: {
    email: string
    password: string
    name: string
  }): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Check if user already exists
      const { data: existingUser } = await this.supabase.from("users").select("id").eq("email", userData.email).single()

      if (existingUser) {
        throw new Error("User already exists")
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12)

      // Create user
      const { data: user, error } = await this.supabase
        .from("users")
        .insert({
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: "user",
          subscription_tier: "free",
          created_at: new Date().toISOString(),
        })
        .select("id, email, name, role, subscription_tier")
        .single()

      if (error) {
        throw new Error(`Registration failed: ${error.message}`)
      }

      // Generate tokens
      const tokens = this.generateTokens(user)

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          subscriptionTier: user.subscription_tier,
        },
        tokens,
      }
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Get user from database
      const { data: user, error } = await this.supabase.from("users").select("*").eq("email", email).single()

      if (error || !user) {
        throw new Error("Invalid credentials")
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        throw new Error("Invalid credentials")
      }

      // Update last login
      await this.supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", user.id)

      // Generate tokens
      const tokens = this.generateTokens(user)

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          subscriptionTier: user.subscription_tier,
        },
        tokens,
      }
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  /**
   * OAuth login (Google, Microsoft)
   */
  async oauthLogin(provider: string, profile: any): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Check if user exists
      let { data: user } = await this.supabase.from("users").select("*").eq("email", profile.email).single()

      if (!user) {
        // Create new user
        const { data: newUser, error } = await this.supabase
          .from("users")
          .insert({
            email: profile.email,
            name: profile.name,
            role: "user",
            subscription_tier: "free",
            provider: provider,
            provider_id: profile.id,
            created_at: new Date().toISOString(),
          })
          .select("*")
          .single()

        if (error) {
          throw new Error(`OAuth registration failed: ${error.message}`)
        }

        user = newUser
      }

      // Update last login
      await this.supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", user.id)

      // Generate tokens
      const tokens = this.generateTokens(user)

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          subscriptionTier: user.subscription_tier,
          provider: user.provider,
        },
        tokens,
      }
    } catch (error) {
      console.error("OAuth login error:", error)
      throw error
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, this.refreshSecret) as any

      // Get user from database
      const { data: user, error } = await this.supabase
        .from("users")
        .select("id, email, name, role, subscription_tier")
        .eq("id", decoded.userId)
        .single()

      if (error || !user) {
        throw new Error("Invalid refresh token")
      }

      // Generate new tokens
      return this.generateTokens(user)
    } catch (error) {
      console.error("Token refresh error:", error)
      throw new Error("Invalid refresh token")
    }
  }

  /**
   * Verify access token
   */
  async verifyToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any

      // Get user from database
      const { data: user, error } = await this.supabase
        .from("users")
        .select("id, email, name, role, subscription_tier")
        .eq("id", decoded.userId)
        .single()

      if (error || !user) {
        throw new Error("Invalid token")
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscriptionTier: user.subscription_tier,
      }
    } catch (error) {
      throw new Error("Invalid token")
    }
  }

  /**
   * Generate JWT tokens
   */
  private generateTokens(user: any): AuthTokens {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      subscriptionTier: user.subscription_tier,
    }

    const accessToken = jwt.sign(payload, this.jwtSecret, { expiresIn: "15m" })
    const refreshToken = jwt.sign({ userId: user.id }, this.refreshSecret, { expiresIn: "7d" })

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    try {
      // Generate reset token
      const resetToken = jwt.sign({ email }, this.jwtSecret, { expiresIn: "1h" })

      // Store reset token in database
      await this.supabase.from("password_resets").insert({
        email,
        token: resetToken,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        created_at: new Date().toISOString(),
      })

      // In production, send email with reset link
      console.log(`Password reset token for ${email}: ${resetToken}`)
    } catch (error) {
      console.error("Password reset error:", error)
      throw error
    }
  }

  /**
   * Update password with reset token
   */
  async updatePassword(token: string, newPassword: string): Promise<void> {
    try {
      // Verify reset token
      const decoded = jwt.verify(token, this.jwtSecret) as any

      // Check if token exists and is not expired
      const { data: resetRecord, error } = await this.supabase
        .from("password_resets")
        .select("*")
        .eq("token", token)
        .eq("email", decoded.email)
        .gt("expires_at", new Date().toISOString())
        .single()

      if (error || !resetRecord) {
        throw new Error("Invalid or expired reset token")
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12)

      // Update user password
      await this.supabase.from("users").update({ password: hashedPassword }).eq("email", decoded.email)

      // Delete used reset token
      await this.supabase.from("password_resets").delete().eq("token", token)
    } catch (error) {
      console.error("Password update error:", error)
      throw error
    }
  }
}

export const authService = new AuthService()
