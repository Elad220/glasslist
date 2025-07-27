'use client'

import Link from 'next/link'
import { ShoppingCart, Sparkles, Users, Zap, ArrowRight, CheckCircle } from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: ShoppingCart,
      title: "Smart Organization",
      description: "Organize your shopping lists by aisle and category for efficient shopping trips",
      delay: "stagger-1"
    },
    {
      icon: Sparkles,
      title: "AI Quick Add",
      description: "Add items naturally with AI - just type '2 liters of milk and a dozen eggs'",
      delay: "stagger-2"
    },
    {
      icon: Users,
      title: "Multiple Lists",
      description: "Create separate lists for different stores, occasions, or family members",
      delay: "stagger-3"
    },
    {
      icon: Zap,
      title: "Shopping Mode",
      description: "Full-screen mode with large text for easy viewing while shopping",
      delay: "stagger-4"
    }
  ]

  const benefits = [
    "Never forget items again",
    "Save time with smart categorization", 
    "Beautiful, modern interface",
    "Works on all your devices",
    "Completely free to use"
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 glass-white rounded-full blur-3xl opacity-20 animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 glass-white rounded-full blur-3xl opacity-10 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] glass-white rounded-full blur-3xl opacity-5 animate-morph"></div>
          <div className="absolute top-3/4 left-1/3 w-32 h-32 bg-gradient-to-r from-primary to-secondary rounded-full blur-2xl opacity-30 animate-pulse-glow"></div>
          <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-gradient-to-r from-secondary to-accent rounded-full blur-2xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Hero Card */}
          <div className="glass-premium p-12 md:p-16 mb-8 animate-scale-in hover-lift">
            <div className="mb-6">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-primary animate-bounce-in" />
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient">
                GlassList
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-3xl mx-auto leading-relaxed">
              The most beautiful shopping list app you've ever used. 
              Organize, shop, and never forget items again with AI-powered assistance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/auth" 
                className="glass-premium px-8 py-4 text-lg font-semibold flex items-center gap-2 group hover-glow micro-interaction animate-slide-up"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="#features" 
                className="glass-premium bg-glass-white-light px-8 py-4 text-lg font-semibold hover:bg-glass-white-border hover-lift micro-interaction animate-slide-up stagger-1"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Quick Demo */}
          <div className="glass-premium p-8 max-w-2xl mx-auto animate-slide-up stagger-2 hover-lift">
            <p className="text-text-secondary mb-4 animate-fade-in">✨ Try the AI Quick Add:</p>
            <div className="bg-glass-white-light rounded-lg p-4 text-left font-mono text-sm overflow-hidden relative">
              <div className="absolute inset-0 animate-shimmer"></div>
              <span className="text-text-secondary relative">"</span>
              <span className="text-primary relative">2 liters of milk, a loaf of bread, and a dozen eggs</span>
              <span className="text-text-secondary relative">"</span>
            </div>
            <p className="text-xs text-text-secondary mt-2 animate-slide-up stagger-3">→ Automatically organized into Dairy, Bakery categories</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-center">
              Why Choose GlassList?
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Experience shopping list management reimagined with modern design and intelligent features
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {features.map((feature, index) => (
              <div key={index} className={`glass-premium p-8 text-center group hover:scale-105 transition-all duration-300 animate-slide-up ${feature.delay} hover-glow`}>
                <feature.icon className="w-12 h-12 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform group-hover:animate-wave" />
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Benefits List */}
          <div className="glass-card p-12 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8">Everything you need for better shopping</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-text-secondary">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card p-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to transform your shopping?
            </h2>
            <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
              Join thousands of users who have simplified their shopping with GlassList. 
              Sign up now and experience the future of shopping lists.
            </p>
            
            <Link 
              href="/auth" 
              className="glass-button px-12 py-6 text-xl font-semibold inline-flex items-center gap-3 group"
            >
              Start Your Shopping Journey
              <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </Link>
            
            <p className="text-sm text-text-secondary mt-4">
              No credit card required • Free forever • Setup in 30 seconds
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-glass-white-border">
        <div className="max-w-6xl mx-auto text-center">
          <div className="glass-card p-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <ShoppingCart className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg">GlassList</span>
            </div>
            <p className="text-text-secondary text-sm">
              Making shopping lists beautiful, one item at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
