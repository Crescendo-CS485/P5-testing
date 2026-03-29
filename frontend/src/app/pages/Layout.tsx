import { Outlet, NavLink, Link } from "react-router";
import { Music, TrendingUp, Disc, List, Radio, Users, Search, Menu, X, LogOut } from "lucide-react";
import { Toaster } from "../components/ui/sonner";
import { Input } from "../components/ui/input";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { AuthModal } from "../components/AuthModal";
import { Artist, Album } from "../data/mockData";

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState<{ open: boolean; tab: "join" | "signin" }>({
    open: false,
    tab: "join",
  });
  const { user, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ artists: Artist[]; albums: Album[] } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults(null);
      return;
    }
    const t = setTimeout(() =>
      fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        .then((r) => r.json())
        .then(setSearchResults),
      300
    );
    return () => clearTimeout(t);
  }, [searchQuery]);

  const navItems = [
    { to: "/", label: "Discovery", icon: Radio },
    { to: "/best-albums", label: "Best Albums", icon: TrendingUp },
    { to: "/new-releases", label: "New Releases", icon: Disc },
    { to: "/lists", label: "Lists", icon: List },
    { to: "/genres", label: "Genres", icon: Music },
    { to: "/community", label: "Community", icon: Users },
  ];

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Toaster position="top-right" theme="dark" />

      {/* Header - AOTY Style */}
      <header className="bg-[#0f0f0f] border-b border-[#2a2a2a] sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between h-16">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-[#999999] hover:text-white transition-colors p-2 -ml-2"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#5b9dd9] to-[#4a8bc2] flex items-center justify-center">
                <Music className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white tracking-tight">Crescendo</h1>
                <p className="text-[9px] text-[#666666] uppercase tracking-wider -mt-0.5">
                  Music Discovery
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                <Input
                  type="search"
                  placeholder="Search artists, albums, songs..."
                  aria-label="Search artists, albums, songs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                  className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#666666] h-9 rounded-sm focus-visible:border-[#5b9dd9] focus-visible:ring-[#5b9dd9]/20"
                />
                {searchOpen && searchResults && (searchResults.artists.length > 0 || searchResults.albums.length > 0) && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-[#1e1e1e] border border-[#2a2a2a] z-50 shadow-lg max-h-80 overflow-y-auto">
                    {searchResults.artists.length > 0 && (
                      <div>
                        <p className="text-[10px] text-[#666666] uppercase tracking-wide px-3 pt-2 pb-1">Artists</p>
                        {searchResults.artists.map((a) => (
                          <Link
                            key={a.id}
                            to={`/artists/${a.id}`}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-[#2a2a2a] transition-colors"
                            onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
                          >
                            <img src={a.image} alt={a.name} className="w-8 h-8 object-cover flex-shrink-0" />
                            <span className="text-sm text-white">{a.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    {searchResults.albums.length > 0 && (
                      <div>
                        <p className="text-[10px] text-[#666666] uppercase tracking-wide px-3 pt-2 pb-1">Albums</p>
                        {searchResults.albums.map((a) => (
                          <Link
                            key={a.id}
                            to={`/artists/${a.artistId}`}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-[#2a2a2a] transition-colors"
                            onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
                          >
                            <img src={a.coverUrl} alt={a.title} className="w-8 h-8 object-cover flex-shrink-0" />
                            <div>
                              <p className="text-sm text-white">{a.title}</p>
                              <p className="text-xs text-[#999999]">{a.artistName}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <>
                  {/* Avatar + name */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-sm bg-[#5b9dd9] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm text-white font-medium max-w-[120px] truncate">
                      {user.displayName}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    aria-label="Sign out"
                    className="flex items-center gap-1 text-xs text-[#666666] hover:text-white transition-colors px-2 py-1.5 rounded-sm hover:bg-[#1a1a1a]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sign out</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setAuthModal({ open: true, tab: "signin" })}
                    className="text-xs text-[#999999] hover:text-white transition-colors px-2 sm:px-3 py-1.5 rounded-sm hover:bg-[#1a1a1a]"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setAuthModal({ open: true, tab: "join" })}
                    className="text-xs bg-[#5b9dd9] hover:bg-[#4a8bc2] text-white px-2 sm:px-3 py-1.5 rounded-sm transition-colors font-medium"
                  >
                    Join
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Desktop Navigation Tabs - AOTY Style */}
          <nav className="hidden lg:flex items-center gap-0 -mb-px overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-all whitespace-nowrap ${
                      isActive
                        ? "border-[#5b9dd9] text-white font-medium"
                        : "border-transparent text-[#999999] hover:text-white hover:border-[#333333]"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div id="mobile-menu" className="fixed top-16 left-0 right-0 bottom-0 bg-[#0f0f0f] border-r border-[#2a2a2a] z-40 lg:hidden overflow-y-auto">
            <nav className="p-4" aria-label="Mobile navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-4 mb-1 rounded-sm transition-all ${
                        isActive
                          ? "bg-[#5b9dd9] text-white"
                          : "text-[#999999] hover:text-white hover:bg-[#1a1a1a]"
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-base font-medium">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Mobile Menu Footer */}
            <div className="p-4 border-t border-[#2a2a2a] mt-4">
              <p className="text-xs text-[#666666] mb-3">
                Empowering independent artists through synthetic community engagement.
              </p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-[#5b9dd9] to-[#4a8bc2] flex items-center justify-center rounded-sm">
                  <Music className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-xs text-[#999999]">
                  Built with transparency • <span className="text-[#7c3aed]">AI-Powered</span>
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Search */}
      <div className="md:hidden bg-[#0f0f0f] border-b border-[#2a2a2a] px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <Input
            type="search"
            placeholder="Search..."
            aria-label="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#666666] h-9 rounded-sm"
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-64px)]">
        <Outlet />
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.open}
        initialTab={authModal.tab}
        onClose={() => setAuthModal((s) => ({ ...s, open: false }))}
      />

      {/* Footer - AOTY Style */}
      <footer className="bg-[#0f0f0f] border-t border-[#2a2a2a] mt-12">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <h3 className="text-white font-bold text-sm mb-3">About</h3>
              <ul className="space-y-2 text-xs text-[#999999]">
                <li><Link to="/info/about-crescendo" className="hover:text-white transition-colors">About Crescendo</Link></li>
                <li><Link to="/info/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link to="/info/for-artists" className="hover:text-white transition-colors">For Artists</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm mb-3">Community</h3>
              <ul className="space-y-2 text-xs text-[#999999]">
                <li><Link to="/info/guidelines" className="hover:text-white transition-colors">Guidelines</Link></li>
                <li><Link to="/info/support" className="hover:text-white transition-colors">Support</Link></li>
                <li><Link to="/info/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm mb-3">Features</h3>
              <ul className="space-y-2 text-xs text-[#999999]">
                <li><Link to="/info/bot-transparency" className="hover:text-white transition-colors">Bot Transparency</Link></li>
                <li><Link to="/info/synthetic-communities" className="hover:text-white transition-colors">Synthetic Communities</Link></li>
                <li><Link to="/info/artist-tools" className="hover:text-white transition-colors">Artist Tools</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm mb-3">Legal</h3>
              <ul className="space-y-2 text-xs text-[#999999]">
                <li><Link to="/info/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/info/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/info/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-[#2a2a2a] flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-[#666666]">
              © 2026 Crescendo. Empowering independent artists through synthetic community engagement.
            </p>
            <p className="text-xs text-[#666666]">
              Built with transparency • <span className="text-[#7c3aed]">AI-Powered</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
