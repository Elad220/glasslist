'use client'

import Link from 'next/link'
import { ShoppingCart, Sparkles, Users, Zap, ArrowRight, CheckCircle, Star, Shield, Clock } from 'lucide-react'

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

  const stats = [
    { number: "10K+", label: "Active Users" },
    { number: "50K+", label: "Lists Created" },
    { number: "99.9%", label: "Uptime" }
  ]

  return (
    <div className="min-h-screen animate-page-load">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Enhanced floating background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 glass-white rounded-full blur-3xl opacity-15 animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 glass-white rounded-full blur-3xl opacity-10 animate-float floating-delayed"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] glass-white rounded-full blur-3xl opacity-5 animate-morph"></div>
          <div className="absolute top-3/4 left-1/3 w-40 h-40 bg-gradient-to-r from-primary to-accent rounded-full blur-2xl opacity-20 animate-pulse-glow"></div>
          <div className="absolute bottom-1/3 right-1/3 w-56 h-56 bg-gradient-to-r from-accent to-primary rounded-full blur-2xl opacity-15 animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Hero Card */}
          <div className="glass-premium p-12 md:p-16 mb-8 animate-scale-in hover-lift">
            <div className="mb-8">
              <div className="relative inline-block mb-6">
                <ShoppingCart className="w-20 h-20 mx-auto text-primary animate-bounce-in" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 gradient-text animate-gradient">
                GlassList
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-glass-muted mb-10 max-w-3xl mx-auto leading-relaxed">
              The most beautiful shopping list app you've ever used. 
              Organize, shop, and never forget items again with AI-powered assistance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link 
                href="/auth" 
                className="glass-button px-10 py-4 text-lg font-semibold flex items-center gap-3 group hover-glow micro-interaction animate-slide-up button-primary"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="#features" 
                className="glass-button bg-glass-white-light px-10 py-4 text-lg font-semibold hover:bg-glass-white-border hover-lift micro-interaction animate-slide-up stagger-1"
              >
                Learn More
              </Link>
            </div>

            {/* Stats */}
            <div className="flex justify-center items-center gap-8 text-sm text-glass-muted">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-glass-heading">{stat.number}</span>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Demo */}
          <div className="glass-premium p-8 max-w-2xl mx-auto animate-slide-up stagger-2 hover-lift">
            <p className="text-glass-muted mb-4 animate-fade-in flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Try the AI Quick Add:
            </p>
            <div className="bg-glass-white-light rounded-lg p-4 text-left font-mono text-sm overflow-hidden relative">
              <div className="absolute inset-0 animate-shimmer"></div>
              <span className="text-glass-muted relative">"</span>
              <span className="text-primary relative font-medium">2 liters of milk, a loaf of bread, and a dozen eggs</span>
              <span className="text-glass-muted relative">"</span>
            </div>
            <p className="text-xs text-glass-muted mt-3 animate-slide-up stagger-3 flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              Automatically organized into Dairy, Bakery categories
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-center text-glass-heading">
              Why Choose GlassList?
            </h2>
            <p className="text-xl text-glass-muted max-w-3xl mx-auto">
              Experience shopping list management reimagined with modern design and intelligent features
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {features.map((feature, index) => (
              <div key={index} className={`glass-card p-8 text-center group card-hover animate-slide-up ${feature.delay} hover-glow`}>
                <div className="relative mb-6">
                  <feature.icon className="w-14 h-14 mx-auto text-primary group-hover:scale-110 transition-transform group-hover:animate-wave" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-glass-heading">{feature.title}</h3>
                <p className="text-glass-muted leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Benefits List */}
          <div className="glass-card p-12 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8 text-glass-heading">Everything you need for better shopping</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-4 group">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-glass-muted group-hover:text-glass-heading transition-colors">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-8 text-center">
            <div className="flex justify-center items-center gap-6 mb-6">
              <div className="flex items-center gap-2 text-glass-muted">
                <Shield className="w-5 h-5 text-primary" />
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center gap-2 text-glass-muted">
                <Clock className="w-5 h-5 text-primary" />
                <span>Always Available</span>
              </div>
              <div className="flex items-center gap-2 text-glass-muted">
                <Star className="w-5 h-5 text-primary" />
                <span>Free Forever</span>
              </div>
            </div>
            <p className="text-glass-muted">
              Your data is encrypted and secure. We never share your information with third parties.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-premium p-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-glass-heading">
              Ready to transform your shopping?
            </h2>
            <p className="text-xl text-glass-muted mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of users who have simplified their shopping with GlassList. 
              Sign up now and experience the future of shopping lists.
            </p>
            
            <Link 
              href="/auth" 
              className="glass-button px-12 py-6 text-xl font-semibold inline-flex items-center gap-3 group button-primary"
            >
              Start Your Shopping Journey
              <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </Link>
            
            <p className="text-sm text-glass-muted mt-6">
              No credit card required • Free forever • Setup in 30 seconds
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-glass-white-border">
        <div className="max-w-6xl mx-auto text-center">
          <div className="glass-card p-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <ShoppingCart className="w-8 h-8 text-primary" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-primary to-accent rounded-full"></div>
              </div>
              <span className="font-bold text-xl text-glass-heading">GlassList</span>
            </div>
            <p className="text-glass-muted text-sm mb-4">
              Making shopping lists beautiful, one item at a time.
            </p>
            <div className="flex justify-center items-center gap-6 text-xs text-glass-muted">
              <span>© 2024 GlassList</span>
              <span>•</span>
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
