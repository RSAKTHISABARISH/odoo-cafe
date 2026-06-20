// ============================================================
// Café Totaram — Public Landing Page
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductStore, useSettingsStore, useAuthStore } from '../store';
import {
  MapPin, Phone, Clock, ChevronDown, Star, ArrowRight,
  Menu as MenuIcon, X, UtensilsCrossed, Coffee, ShieldCheck
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const { products, categories } = useProductStore();
  const { settings } = useSettingsStore();
  const { isAuthenticated } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const featured = products.filter(p => p.available && p.tags.includes('bestseller')).slice(0, 6);
  const allFeatured = featured.length > 0 ? featured : products.filter(p => p.available).slice(0, 6);

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Menu', href: '#menu' },
    { label: 'Reserve Table', href: '/reservation', isRoute: true },
    { label: 'Order Track', href: '/track-order', isRoute: true },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (link: typeof navLinks[0]) => {
    setMobileMenuOpen(false);
    if (link.isRoute) {
      navigate(link.href);
    } else {
      const el = document.querySelector(link.href);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen font-sans bg-[#faf8f5] text-surface-900">

      {/* ── Top Navbar ────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">

          {/* Logo */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-primary-600 rounded-xl flex items-center justify-center text-accent-400 font-display text-xl shadow-md group-hover:scale-105 transition-transform">
              ☕
            </div>
            <span className={`font-display text-2xl tracking-wide transition-colors ${scrolled ? 'text-primary-700' : 'text-surface-900'}`}>
              {settings.restaurantName}
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link)}
                className={`px-4 py-2 rounded-full text-sm font-semibold tracking-wide transition-all ${
                  scrolled
                    ? 'text-surface-700 hover:text-primary-700 hover:bg-primary-50'
                    : 'text-surface-900/90 hover:text-surface-900 hover:bg-white/10'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <button onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-surface-900 rounded-full text-sm font-bold tracking-wide transition-all shadow-md">
                <ShieldCheck className="w-4 h-4" /> Dashboard
              </button>
            ) : (
              <button onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-accent-400 rounded-full text-sm font-bold tracking-wide transition-all shadow-md">
                <ShieldCheck className="w-4 h-4" /> Staff Login
              </button>
            )}
            <button onClick={() => navigate('/self-order')}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-surface-900 rounded-full text-sm font-bold tracking-wide transition-all shadow-md">
              Order Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-xl transition-colors ${scrolled ? 'text-surface-700' : 'text-surface-900'}`}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-surface-200 shadow-xl animate-slide-up">
            <div className="p-4 space-y-1">
              {navLinks.map(link => (
                <button key={link.label} onClick={() => handleNavClick(link)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-surface-700 hover:bg-primary-50 hover:text-primary-700 transition-colors">
                  {link.label}
                </button>
              ))}
              <div className="pt-3 border-t border-surface-200 space-y-2">
                <button onClick={() => { navigate('/self-order'); setMobileMenuOpen(false); }}
                  className="w-full py-3 bg-accent-500 text-surface-900 rounded-full font-bold text-sm">
                  Order Now
                </button>
                <button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                  className="w-full py-3 bg-primary-600 text-accent-400 rounded-full font-bold text-sm">
                  Staff Login
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero Section ───────────────────────────────────── */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background Image */}
        <div className="absolute inset-0">
          <div 
            className="w-full h-full bg-cover bg-center animate-slow-zoom"
            style={{ backgroundImage: 'url(/images/veloura_cafe_bg.png)' }}
          />
        </div>
        {/* Dark overlays for text readability */}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/60 via-transparent to-black/60" />
        
        {/* Decorative circles */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-20">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 mb-8 text-accent-300 text-sm font-semibold tracking-widest uppercase">
            <Star className="w-4 h-4 fill-accent-400 text-accent-400" /> Authentic South Indian Flavours
          </div>
          <h1 className="font-display text-6xl sm:text-8xl text-surface-900 leading-none mb-6 tracking-tight">
            {settings.restaurantName}
          </h1>
          <p className="text-surface-900/70 text-xl sm:text-2xl font-light leading-relaxed max-w-2xl mx-auto mb-12">
            A warm corner for your soul — freshly brewed teas, filter coffee, and home-style meals crafted with love.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
            <button onClick={() => navigate('/self-order')}
              className="group flex items-center gap-3 px-8 py-4 bg-accent-500 hover:bg-accent-400 text-surface-900 rounded-full font-bold text-lg shadow-2xl shadow-accent-900/40 transition-all hover:scale-105">
              Order Online <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => navigate('/reservation')}
              className="flex items-center gap-3 px-8 py-4 bg-primary-600/80 hover:bg-primary-500 backdrop-blur-sm text-surface-900 rounded-full font-bold text-lg transition-all hover:scale-105">
              Book a Table
            </button>
            <button onClick={() => navigate('/track-order')}
              className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-surface-900 border border-white/30 rounded-full font-bold text-lg transition-all hover:scale-105">
              Track My Order
            </button>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-surface-900/40 animate-bounce">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* ── Quick Info Bar ─────────────────────────────────── */}
      <section className="bg-primary-600 text-surface-900 py-5">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
          {[
            { icon: MapPin, label: 'Location', value: 'Near Bus Stand, Totaram Nagar' },
            { icon: Phone, label: 'Reservations', value: '+91 98765 43210' },
            { icon: Clock, label: 'Open Hours', value: '7:00 AM – 10:00 PM Daily' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-center sm:justify-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-accent-300" />
              </div>
              <div>
                <p className="text-surface-900/50 text-xs uppercase tracking-widest font-semibold">{item.label}</p>
                <p className="text-surface-900 font-semibold text-sm">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── About Section ──────────────────────────────────── */}
      <section id="about" className="py-24 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-accent-600 font-bold uppercase tracking-widest text-sm mb-4">Our Story</p>
            <h2 className="font-display text-5xl text-primary-800 leading-tight mb-6">
              Brewed with<br />tradition & love
            </h2>
            <p className="text-surface-600 text-lg leading-relaxed mb-6">
              Café Totaram was born from a desire to bring people together over a steaming cup of authentic filter coffee.
              Since our humble beginning, we've been a neighbourhood institution — a place where every sip tells a story.
            </p>
            <p className="text-surface-500 leading-relaxed mb-8">
              We source our coffee beans directly from Coorg, grind them fresh daily, and serve them the way your grandmother would — unhurried, full of flavour, and always with a warm smile.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { num: '15+', label: 'Years of Service' },
                { num: '50+', label: 'Menu Items' },
                { num: '10K+', label: 'Happy Customers' },
              ].map(stat => (
                <div key={stat.label} className="text-center p-4 bg-primary-50 rounded-2xl border border-primary-100">
                  <p className="font-display text-3xl text-primary-700 mb-1">{stat.num}</p>
                  <p className="text-xs text-surface-500 font-semibold">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-primary-700 to-primary-900 rounded-3xl flex items-center justify-center text-[12rem] shadow-2xl">
              ☕
            </div>
            <div className="absolute -bottom-6 -left-6 bg-accent-400 text-surface-900 p-6 rounded-2xl shadow-xl">
              <p className="font-display text-4xl">★ 4.8</p>
              <p className="text-sm font-semibold opacity-90">Google Reviews</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Menu — Flavorful Cookies Carousel ──────────── */}
      <section id="menu" className="py-20 px-8 bg-[#f5f0eb]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-5xl text-surface-900 mb-2">
              Our Flavorful <span className="underline underline-offset-4 decoration-2">Cookies</span>
            </h2>
          </div>

          {/* Carousel Wrapper */}
          <div className="relative px-8">
            {/* Left Arrow */}
            <button
              onClick={() => {
                const el = document.getElementById('menu-carousel');
                if (el) el.scrollBy({ left: -310, behavior: 'smooth' });
              }}
              className="absolute left-0 top-[45%] -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-surface-100 transition-colors"
            >
              <span className="text-lg font-bold text-surface-700 leading-none">←</span>
            </button>

            {/* Scrollable Items */}
            <div
              id="menu-carousel"
              className="flex gap-5 overflow-x-auto scroll-smooth no-scrollbar"
              style={{ scrollbarWidth: 'none' }}
            >
              {[
                { name: 'Choco Chip Walnut Cookies', price: 220, img: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80&fit=crop' },
                { name: 'Cinnamon Sugar Snaps',      price: 160, img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80&fit=crop' },
                { name: 'Jeera Cookies',             price: 210, img: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?w=400&q=80&fit=crop' },
                { name: 'Cranberry Oatmeal Cookies', price: 230, img: 'https://images.unsplash.com/photo-1590080876072-5c4eb24b1b55?w=400&q=80&fit=crop' },
                { name: 'Peri Peri Garlic Snaps',   price: 175, img: 'https://images.unsplash.com/photo-1605059279784-4e2bada8b6c7?w=400&q=80&fit=crop' },
                { name: 'Brookies',                  price: 220, img: 'https://images.unsplash.com/photo-1548365328-8c6db3220e4d?w=400&q=80&fit=crop' },
                { name: 'Almond Butter Cookies',    price: 245, img: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80&fit=crop' },
                { name: 'Dark Choco Chip Cookies',  price: 255, img: 'https://images.unsplash.com/photo-1471943038886-62a8b89b7e28?w=400&q=80&fit=crop' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex-none w-56 group cursor-pointer"
                >
                  {/* Image with hover overlay buttons */}
                  <div className="w-56 h-56 overflow-hidden mb-3 relative">
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Hover action buttons */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/10">
                      <button className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-primary-50 transition-colors text-surface-600 hover:text-primary-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      </button>
                      <button
                        onClick={() => navigate('/self-order')}
                        className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-primary-50 transition-colors text-surface-600 hover:text-primary-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      </button>
                      <button
                        onClick={() => navigate('/self-order')}
                        className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-primary-50 transition-colors text-surface-600 hover:text-primary-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-surface-800 font-medium text-sm mb-0.5">{item.name}</p>
                  <p className="text-surface-700 font-semibold text-sm">₹{item.price.toFixed(2)}</p>
                </div>
              ))}
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => {
                const el = document.getElementById('menu-carousel');
                if (el) el.scrollBy({ left: 310, behavior: 'smooth' });
              }}
              className="absolute right-0 top-[45%] -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-surface-100 transition-colors"
            >
              <span className="text-lg font-bold text-surface-700 leading-none">→</span>
            </button>
          </div>

          <div className="text-center mt-12">
            <button onClick={() => navigate('/self-order')}
              className="inline-flex items-center gap-3 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-accent-400 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-lg">
              <UtensilsCrossed className="w-5 h-5" /> View Full Menu &amp; Order
            </button>
          </div>
        </div>
      </section>

      {/* ── Why Us Section ─────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-5xl text-primary-800 mb-4">Why Choose Us?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { emoji: '🌱', title: 'Fresh Ingredients', desc: 'We source local, seasonal produce daily to ensure every dish is as fresh as it gets.' },
              { emoji: '☕', title: 'Authentic Recipes', desc: 'Time-tested recipes passed down through generations — the flavours you\'ve been missing.' },
              { emoji: '❤️', title: 'Made with Love', desc: 'Our team puts heart into every cup and plate. Hospitality is not just our job, it\'s our passion.' },
            ].map(item => (
              <div key={item.title} className="text-center p-8 rounded-2xl bg-primary-50 border border-primary-100 hover:border-primary-300 transition-colors">
                <div className="text-6xl mb-5">{item.emoji}</div>
                <h3 className="font-display text-2xl text-primary-700 mb-3">{item.title}</h3>
                <p className="text-surface-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Section ─────────────────────────────────── */}
      <section id="contact" className="py-24 px-4 bg-primary-800 text-surface-900">
        <div className="max-w-4xl mx-auto text-center">
          <Coffee className="w-12 h-12 text-accent-400 mx-auto mb-6" />
          <h2 className="font-display text-5xl mb-4">Come Visit Us</h2>
          <p className="text-surface-900/60 text-lg mb-12">We'd love to see you. Pull up a chair, the coffee's hot.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {[
              { icon: MapPin, title: 'Address', detail: 'Near Bus Stand, Totaram Nagar, India' },
              { icon: Phone, title: 'Phone', detail: '+91 98765 43210' },
              { icon: Clock, title: 'Hours', detail: 'Mon – Sun: 7 AM – 10 PM' },
            ].map(item => (
              <div key={item.title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <item.icon className="w-6 h-6 text-accent-400 mx-auto mb-3" />
                <p className="font-bold text-sm uppercase tracking-widest text-surface-900/50 mb-1">{item.title}</p>
                <p className="text-surface-900 font-medium">{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/self-order')}
              className="px-8 py-4 bg-accent-500 hover:bg-accent-400 text-surface-900 rounded-full font-bold text-lg transition-all hover:scale-105">
              Order Online Now
            </button>
            <button onClick={() => navigate('/track-order')}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-surface-900 border border-white/30 rounded-full font-bold text-lg transition-all">
              Track Your Order
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="bg-primary-900 text-surface-900/40 py-8 text-center text-sm">
        <p>© {new Date().getFullYear()} {settings.restaurantName} · All rights reserved</p>
        <p className="mt-1">
          <button onClick={() => navigate('/login')} className="hover:text-accent-400 transition-colors">
            Staff Portal
          </button>
        </p>
      </footer>
    </div>
  );
}
