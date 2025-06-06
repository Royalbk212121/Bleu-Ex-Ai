/**
 * User Service
 * Manages user profiles, subscriptions, and settings
 */

import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  subscriptionTier: string
  avatar?: string
  preferences: Record<string, any>
  billingInfo?: any
}

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  features: string[]
  stripePriceId: string
}

export class UserService {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-06-20",
  })

  private subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "free",
      name: "Free",
      price: 0,
      features: ["Basic chat", "5 documents/month", "Community support"],
      stripePriceId: "",
    },
    {
      id: "professional",
      name: "Professional",
      price: 49,
      features: ["Unlimited chat", "Unlimited documents", "Advanced editor", "Priority support", "Word add-in"],
      stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID!,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 199,
      features: [
        "Everything in Professional",
        "Custom integrations",
        "Dedicated support",
        "Advanced analytics",
        "Team collaboration",
      ],
      stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
    },
  ]

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const { data: user, error } = await this.supabase.from("users").select("*").eq("id", userId).single()

      if (error || !user) {
        throw new Error("User not found")
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscriptionTier: user.subscription_tier,
        avatar: user.avatar,
        preferences: user.preferences || {},
        billingInfo: user.billing_info,
      }
    } catch (error) {
      console.error("Get user profile error:", error)
      throw error
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<{
      name: string
      avatar: string
      preferences: Record<string, any>
    }>,
  ): Promise<UserProfile> {
    try {
      const { data: user, error } = await this.supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select("*")
        .single()

      if (error) {
        throw new Error(`Profile update failed: ${error.message}`)
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscriptionTier: user.subscription_tier,
        avatar: user.avatar,
        preferences: user.preferences || {},
        billingInfo: user.billing_info,
      }
    } catch (error) {
      console.error("Update user profile error:", error)
      throw error
    }
  }

  /**
   * Get subscription plans
   */
  getSubscriptionPlans(): SubscriptionPlan[] {
    return this.subscriptionPlans
  }

  /**
   * Create Stripe checkout session
   */
  async createCheckoutSession(userId: string, planId: string): Promise<{ sessionId: string; url: string }> {
    try {
      const plan = this.subscriptionPlans.find((p) => p.id === planId)
      if (!plan || plan.id === "free") {
        throw new Error("Invalid subscription plan")
      }

      const user = await this.getUserProfile(userId)

      const session = await this.stripe.checkout.sessions.create({
        customer_email: user.email,
        payment_method_types: ["card"],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
        metadata: {
          userId,
          planId,
        },
      })

      return {
        sessionId: session.id,
        url: session.url!,
      }
    } catch (error) {
      console.error("Create checkout session error:", error)
      throw error
    }
  }

  /**
   * Handle successful subscription
   */
  async handleSubscriptionSuccess(sessionId: string): Promise<void> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId)
      const userId = session.metadata?.userId
      const planId = session.metadata?.planId

      if (!userId || !planId) {
        throw new Error("Invalid session metadata")
      }

      // Update user subscription
      await this.supabase
        .from("users")
        .update({
          subscription_tier: planId,
          stripe_customer_id: session.customer,
          subscription_status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      // Create subscription record
      await this.supabase.from("subscriptions").insert({
        user_id: userId,
        plan_id: planId,
        stripe_subscription_id: session.subscription,
        status: "active",
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Handle subscription success error:", error)
      throw error
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<void> {
    try {
      const user = await this.getUserProfile(userId)

      if (user.subscriptionTier === "free") {
        throw new Error("No active subscription to cancel")
      }

      // Get subscription from database
      const { data: subscription, error } = await this.supabase
        .from("subscriptions")
        .select("stripe_subscription_id")
        .eq("user_id", userId)
        .eq("status", "active")
        .single()

      if (error || !subscription) {
        throw new Error("Active subscription not found")
      }

      // Cancel in Stripe
      await this.stripe.subscriptions.cancel(subscription.stripe_subscription_id)

      // Update database
      await this.supabase
        .from("users")
        .update({
          subscription_tier: "free",
          subscription_status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      await this.supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          canceled_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("status", "active")
    } catch (error) {
      console.error("Cancel subscription error:", error)
      throw error
    }
  }

  /**
   * Get user usage statistics
   */
  async getUserUsage(userId: string): Promise<{
    documentsProcessed: number
    chatMessages: number
    aiRequests: number
    storageUsed: number
  }> {
    try {
      // Get document count
      const { count: documentsCount } = await this.supabase
        .from("legal_documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)

      // Get chat message count
      const { count: chatCount } = await this.supabase
        .from("chat_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)

      // Get AI request count
      const { count: aiCount } = await this.supabase
        .from("agent_tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)

      return {
        documentsProcessed: documentsCount || 0,
        chatMessages: chatCount || 0,
        aiRequests: aiCount || 0,
        storageUsed: 0, // Calculate based on document sizes
      }
    } catch (error) {
      console.error("Get user usage error:", error)
      return {
        documentsProcessed: 0,
        chatMessages: 0,
        aiRequests: 0,
        storageUsed: 0,
      }
    }
  }

  /**
   * Check feature access based on subscription tier
   */
  hasFeatureAccess(subscriptionTier: string, feature: string): boolean {
    const featureMap: Record<string, string[]> = {
      free: ["basic_chat", "document_upload"],
      professional: [
        "basic_chat",
        "document_upload",
        "advanced_editor",
        "word_addin",
        "unlimited_documents",
        "priority_support",
      ],
      enterprise: [
        "basic_chat",
        "document_upload",
        "advanced_editor",
        "word_addin",
        "unlimited_documents",
        "priority_support",
        "custom_integrations",
        "team_collaboration",
        "advanced_analytics",
      ],
    }

    return featureMap[subscriptionTier]?.includes(feature) || false
  }
}

export const userService = new UserService()
