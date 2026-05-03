import { Outlet, Link, useLocation } from "react-router-dom";
import { BookHeart, Clapperboard, Library, Music, Sparkles } from "lucide-react";

export function RootLayout() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.68))] backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-6">
            {/* <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all ${
                location.pathname === '/'
                  ? 'border-white/30 bg-[linear-gradient(135deg,#0f6cbd_0%,#0ea5e9_60%,#67e8f9_100%)] text-white shadow-[0_14px_30px_rgba(15,108,189,0.28)]'
                  : 'border-transparent text-muted-foreground hover:border-white/80 hover:text-foreground hover:bg-white/85'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Chat</span>
            </Link> */}
            <Link
              to="/my-prayers-club"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all ${
                location.pathname === '/my-prayers-club'
                  ? 'border-white/30 bg-[linear-gradient(135deg,#0f6cbd_0%,#0ea5e9_60%,#67e8f9_100%)] text-white shadow-[0_14px_30px_rgba(15,108,189,0.28)]'
                  : 'border-transparent text-muted-foreground hover:border-white/80 hover:text-foreground hover:bg-white/85'
              }`}
            >
              <BookHeart className="w-5 h-5" />
              <span>MyPrayersClub</span>
            </Link>
            <Link
              to="/studio"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all ${
                location.pathname === '/studio'
                  ? 'border-white/30 bg-[linear-gradient(135deg,#0f6cbd_0%,#0ea5e9_60%,#67e8f9_100%)] text-white shadow-[0_14px_30px_rgba(15,108,189,0.28)]'
                  : 'border-transparent text-muted-foreground hover:border-white/80 hover:text-foreground hover:bg-white/85'
              }`}
            >
              <Clapperboard className="w-5 h-5" />
              <span>Studio</span>
            </Link>
            <Link
              to="/music"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all ${
                location.pathname === '/music'
                  ? 'border-white/30 bg-[linear-gradient(135deg,#0f6cbd_0%,#0ea5e9_60%,#67e8f9_100%)] text-white shadow-[0_14px_30px_rgba(15,108,189,0.28)]'
                  : 'border-transparent text-muted-foreground hover:border-white/80 hover:text-foreground hover:bg-white/85'
              }`}
            >
              <Music className="w-5 h-5" />
              <span>ElevenLab</span>
            </Link>
            <Link
              to="/looplab"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all ${
                location.pathname === '/looplab'
                  ? 'border-white/30 bg-[linear-gradient(135deg,#0f6cbd_0%,#0ea5e9_60%,#67e8f9_100%)] text-white shadow-[0_14px_30px_rgba(15,108,189,0.28)]'
                  : 'border-transparent text-muted-foreground hover:border-white/80 hover:text-foreground hover:bg-white/85'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span>LoopLab</span>
            </Link>
            <Link
              to="/instrument-library"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all ${
                location.pathname === '/instrument-library'
                  ? 'border-white/30 bg-[linear-gradient(135deg,#0f6cbd_0%,#0ea5e9_60%,#67e8f9_100%)] text-white shadow-[0_14px_30px_rgba(15,108,189,0.28)]'
                  : 'border-transparent text-muted-foreground hover:border-white/80 hover:text-foreground hover:bg-white/85'
              }`}
            >
              <Library className="w-5 h-5" />
              <span>Instrument Library</span>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
