'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/use-auth-store';
import { authService } from '@/services/auth.service';
import { marketplaceService, MarketplaceArtwork } from '@/features/marketplace/services/marketplace.service';

export default function MarketplaceHomePage() {
  const { user, isAuthenticated, clearAuth, setUser } = useAuthStore();
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [marketplaceArtworks, setMarketplaceArtworks] = useState<MarketplaceArtwork[]>([]);

  useEffect(() => {
    if (isAuthenticated && !user) {
      authService
        .getCurrentUser()
        .then(({ user: fetchedUser, roles: fetchedRoles }) => {
          setUser(fetchedUser, fetchedRoles);
        })
        .catch(() => {
          clearAuth();
        });
    }
  }, [isAuthenticated, user, setUser, clearAuth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const loadArtworks = async () => {
      try {
        const artworks = await marketplaceService.getArtworks();
        setMarketplaceArtworks(artworks.slice(0, 6));
      } catch (error) {
        console.error('Failed to load marketplace feed', error);
      }
    };
    loadArtworks();
  }, []);

  return (
    <div className="relative">
      {/* Custom Mouse Cursor Glow Effect */}
      <div
        className="fixed w-[400px] h-[400px] bg-[#A7ACD9]/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2 z-[-5] transition-opacity duration-300 hidden md:block"
        style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
      />

      <div className="relative overflow-hidden">
        {/* Atmospheric Background */}
        <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-[#c2c7f6]/5 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-[#c9c5ca]/5 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />

        {/* ── HERO ── */}
        <section className="max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-5 space-y-8">
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-[0.2em] text-[#A7ACD9] font-medium block">
                Curated Collective
              </span>
              <h1 className="font-h1 text-4xl md:text-5xl font-bold leading-tight tracking-tight text-white">
                Where the Deep Blue meets the{' '}
                <span className="text-[#A7ACD9] italic font-light">Vast Stillness</span>
              </h1>
              <p className="text-base md:text-lg text-[#c7c5cf] max-w-md">
                Experience the weightless world of Digital Etherealism. A gallery for the modern
                collector seeking high-performance serenity.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/register"
                className="bg-[#A7ACD9] text-[#282e53] px-8 py-3.5 rounded-full font-bold text-sm hover:shadow-[0_0_20px_rgba(167,172,217,0.4)] transition-all active:scale-95 inline-flex items-center space-x-2"
              >
                <span>Explore Gallery</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
              <Link
                href="#bento"
                className="border border-[#A7ACD9]/30 hover:border-[#A7ACD9] text-[#A7ACD9] hover:text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-all backdrop-blur-sm active:scale-95"
              >
                Learn More
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-6">
              <div>
                <p className="font-h1 text-2xl font-bold text-white">1.2k</p>
                <p className="text-[10px] text-[#919099] uppercase tracking-wider font-medium">Artworks</p>
              </div>
              <div className="w-px h-10 bg-[#46464e]/30" />
              <div>
                <p className="font-h1 text-2xl font-bold text-white">450</p>
                <p className="text-[10px] text-[#919099] uppercase tracking-wider font-medium">Artists</p>
              </div>
              <div className="w-px h-10 bg-[#46464e]/30" />
              <div>
                <p className="font-h1 text-2xl font-bold text-white">0.4 ETH</p>
                <p className="text-[10px] text-[#919099] uppercase tracking-wider font-medium">Floor Price</p>
              </div>
            </div>
          </div>

          {/* Floating Showcase Frame */}
          <div className="md:col-span-7 relative">
            <div className="animate-float relative z-10 p-4 glass-container rounded-[32px] periwinkle-glow">
              <div className="aspect-[16/10] overflow-hidden rounded-2xl relative group">
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt="Digital Etherealism Landscape"
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131316]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                  <div className="space-y-1">
                    <h3 className="font-h1 text-xl font-bold text-white">Lumina Sequence #04</h3>
                    <p className="text-sm text-[#c7c5cf]">Artist: Ethereal_Mind</p>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>
            <div className="absolute -top-12 -right-12 w-64 h-64 border border-[#A7ACD9]/10 rounded-full animate-pulse pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-[#A7ACD9]/5 rounded-2xl rotate-12 blur-sm pointer-events-none" />
            <div className="absolute -right-6 bottom-10 z-20 glass-container p-5 rounded-2xl border border-white/10 periwinkle-glow hidden lg:block">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#A7ACD9]/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#A7ACD9]">auto_awesome</span>
                </div>
                <div>
                  <p className="text-[10px] text-[#A7ACD9] uppercase tracking-wider font-semibold">Current Bid</p>
                  <p className="font-h1 text-xl font-bold text-white">2.45 ETH</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PAGINATION MARKERS ── */}
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
            <div className="flex items-center gap-2 group cursor-pointer">
              <span className="text-xs font-bold text-[#A7ACD9]">01</span>
              <div className="w-12 h-1 bg-[#A7ACD9] rounded-full" />
            </div>
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <div
                key={num}
                className="flex items-center gap-2 group cursor-pointer opacity-40 hover:opacity-100 transition-opacity"
              >
                <span className="text-xs font-medium text-[#c7c5cf] group-hover:text-[#A7ACD9]">
                  {num < 10 ? `0${num}` : num}
                </span>
                <div className="w-4 h-1 bg-[#46464e] group-hover:bg-[#A7ACD9] group-hover:w-8 transition-all rounded-full" />
              </div>
            ))}
          </div>
        </section>

        {/* ── BENTO GRID ── */}
        <section id="bento" className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-[#A7ACD9] font-medium block">
                Market Trends
              </span>
              <h2 className="font-h1 text-3xl font-bold text-white">Curated Collections</h2>
            </div>
            <button className="flex items-center gap-2 text-[#A7ACD9] text-sm hover:underline active:scale-95 transition-all cursor-pointer">
              <span>View All Collections</span>
              <span className="material-symbols-outlined text-lg">arrow_right_alt</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8 group relative aspect-[16/9] overflow-hidden rounded-[28px] glass-container border border-white/10 periwinkle-glow cursor-pointer">
              <img
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                alt="Neural Horizons Collection"
                src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1200&auto=format&fit=crop"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131316]/90 via-[#131316]/20 to-transparent p-10 flex flex-col justify-end">
                <span className="text-xs text-[#A7ACD9] uppercase tracking-widest font-semibold mb-2">
                  Featured Collection
                </span>
                <h3 className="font-h1 text-3xl font-bold text-white mb-2">Neural Horizons</h3>
                <p className="text-sm text-[#c7c5cf] max-w-md">
                  Exploring the intersection of artificial cognition and organic serenity.
                </p>
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col gap-8">
              <div className="h-1/2 group relative overflow-hidden rounded-[28px] glass-container border border-white/10 periwinkle-glow cursor-pointer min-h-[200px]">
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  alt="Crystal Flow Collection"
                  src="https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop"
                />
                <div className="absolute inset-0 bg-[#131316]/50 p-6 flex flex-col justify-end">
                  <h4 className="font-h1 text-xl font-bold text-white">Crystal Flow</h4>
                </div>
              </div>

              <div className="h-1/2 group relative overflow-hidden rounded-[28px] glass-container border border-white/10 periwinkle-glow cursor-pointer min-h-[200px]">
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  alt="Viscosity Genesis Collection"
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop"
                />
                <div className="absolute inset-0 bg-[#131316]/50 p-6 flex flex-col justify-end">
                  <h4 className="font-h1 text-xl font-bold text-white">Viscosity Genesis</h4>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MARKETPLACE FEED ── */}
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#A7ACD9]">Marketplace Feed</p>
              <h2 className="font-h1 text-3xl font-bold text-white">Fresh from creators</h2>
            </div>
            <Link href="/creator-setup" className="text-sm text-[#A7ACD9] hover:underline">
              Set up your studio
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {marketplaceArtworks.length ? (
              marketplaceArtworks.map((artwork) => (
                <Link
                  key={artwork.id}
                  href={`/artworks/${artwork.id}`}
                  className="group overflow-hidden rounded-[24px] border border-white/10 bg-[#1b1d29]"
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      fill
                      unoptimized
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-white">{artwork.title}</h3>
                      <span className="text-xs text-[#A7ACD9]">New</span>
                    </div>
                    <p className="text-sm text-[#C7C5CF]">{artwork.creatorName ?? 'Verified creator'}</p>
                    <div className="flex flex-wrap gap-2">
                      {(artwork.tags ?? []).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wider text-[#C7C5CF]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="md:col-span-3 rounded-[24px] border border-dashed border-white/10 bg-white/5 p-10 text-center text-[#C7C5CF]">
                Loading marketplace feed...
              </div>
            )}
          </div>
        </section>

        {/* ── NEWSLETTER CTA ── */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="relative glass-container rounded-[3rem] p-10 md:p-20 overflow-hidden border border-white/10 text-center space-y-8 periwinkle-glow">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="font-h1 text-3xl md:text-4xl font-bold text-white">Join the Ethereal Wave</h2>
              <p className="text-base text-[#c7c5cf]">
                Receive exclusive access to drop schedules and private curation events.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto pt-2">
                <input
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-3.5 focus:outline-none focus:ring-1 focus:ring-[#A7ACD9] focus:border-[#A7ACD9] transition-all text-sm text-[#e4e1e5] placeholder-white/30"
                  placeholder="Enter your email address"
                  type="email"
                />
                <button className="bg-[#A7ACD9] text-[#1F2335] px-8 py-3.5 rounded-full font-bold text-sm hover:shadow-[0_0_15px_rgba(167,172,217,0.5)] transition-all active:scale-95 whitespace-nowrap cursor-pointer">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0e0e11] border-t border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center py-16 px-6 max-w-7xl mx-auto gap-10">
          <div className="space-y-3 text-center md:text-left">
            <Link href="/">
              <img
                src="/weblogo.png"
                alt="dillustration"
                className="h-12 md:h-14 w-auto object-contain hover:opacity-80 transition-opacity"
              />
            </Link>
            <p className="text-xs text-[#919099] max-w-xs leading-relaxed">
              Curating the future of digital etherealism for a new generation of collectors.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-12 text-xs">
            <div className="flex flex-col gap-2">
              <span className="text-[#A7ACD9] uppercase tracking-widest font-bold mb-1">Navigation</span>
              <Link href="#" className="text-[#919099] hover:text-[#A7ACD9]">Marketplace</Link>
              <Link href="#" className="text-[#919099] hover:text-[#A7ACD9]">Artists</Link>
              <Link href="#" className="text-[#919099] hover:text-[#A7ACD9]">Curations</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[#A7ACD9] uppercase tracking-widest font-bold mb-1">Legal</span>
              <Link href="#" className="text-[#919099] hover:text-[#A7ACD9]">Privacy Policy</Link>
              <Link href="#" className="text-[#919099] hover:text-[#A7ACD9]">Terms of Service</Link>
              <Link href="#" className="text-[#919099] hover:text-[#A7ACD9]">Guidelines</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[#A7ACD9] uppercase tracking-widest font-bold mb-1">Support</span>
              <Link href="#" className="text-[#919099] hover:text-[#A7ACD9]">Contact Us</Link>
              <Link href="#" className="text-[#919099] hover:text-[#A7ACD9]">Help Center</Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#919099]/60">
          <p>© 2026 dillustration. Digital Etherealism Art Collective.</p>
          <div className="flex gap-6">
            <span className="material-symbols-outlined text-lg cursor-pointer hover:text-white">public</span>
            <span className="material-symbols-outlined text-lg cursor-pointer hover:text-white">hub</span>
            <span className="material-symbols-outlined text-lg cursor-pointer hover:text-white">share</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
