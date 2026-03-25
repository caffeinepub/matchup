import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import {
  Calendar,
  Clock,
  Heart,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  Plus,
  Search,
  Target,
  Trophy,
  Users,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Match } from "./backend.d";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useCreateMatch,
  useGetAllMatches,
  useJoinMatch,
} from "./hooks/useQueries";

const SPORTS = ["Soccer", "Basketball", "Tennis", "Volleyball", "Badminton"];

const SPORT_CONFIG: Record<
  string,
  { band: string; emoji: string; color: string; flickrTag: string }
> = {
  Soccer: {
    band: "sport-band-soccer",
    emoji: "⚽",
    color: "#22C55E",
    flickrTag: "soccer",
  },
  Basketball: {
    band: "sport-band-basketball",
    emoji: "🏀",
    color: "#F97316",
    flickrTag: "basketball",
  },
  Tennis: {
    band: "sport-band-tennis",
    emoji: "🎾",
    color: "#EAB308",
    flickrTag: "tennis",
  },
  Volleyball: {
    band: "sport-band-volleyball",
    emoji: "🏐",
    color: "#3B82F6",
    flickrTag: "volleyball",
  },
  Badminton: {
    band: "sport-band-badminton",
    emoji: "🏸",
    color: "#A855F7",
    flickrTag: "badminton",
  },
};

function getSportConfig(sport: string) {
  return (
    SPORT_CONFIG[sport] ?? {
      band: "sport-band-default",
      emoji: "🎯",
      color: "#14B8A6",
      flickrTag: "sport",
    }
  );
}

function formatDateTime(timeStr: string): string {
  try {
    const d = new Date(timeStr);
    return d.toLocaleDateString("vi-VN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return timeStr;
  }
}

// ---- CONNECTION STATUS ----
function ConnectionStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const { isFetching, isError } = useGetAllMatches();

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!online || isError) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-red-500">
        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
        <WifiOff className="w-3 h-3" />
        <span className="hidden sm:inline">Mất kết nối</span>
      </div>
    );
  }

  if (isFetching) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-yellow-600">
        <span className="w-2 h-2 rounded-full bg-yellow-500 pulse-yellow shrink-0" />
        <span className="hidden sm:inline">Đang kết nối...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
      <span className="w-2 h-2 rounded-full bg-green-500 pulse-green shrink-0" />
      <Wifi className="w-3 h-3" />
      <span className="hidden sm:inline">Trực tuyến</span>
    </div>
  );
}

// ---- HEADER ----
function Header({ onCreateClick }: { onCreateClick: () => void }) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.52 0.22 260), oklch(0.65 0.14 188))",
              }}
            >
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">
              MatchUp
            </span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#matches"
              data-ocid="nav.link"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Tìm trận
            </a>
            <button
              type="button"
              onClick={onCreateClick}
              data-ocid="nav.create_link"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Tạo trận
            </button>
          </nav>

          {/* Auth + Connection */}
          <div className="flex items-center gap-3">
            <ConnectionStatus />
            {isLoggedIn ? (
              <>
                <span className="hidden sm:block text-xs text-muted-foreground truncate max-w-[100px]">
                  {identity.getPrincipal().toString().slice(0, 10)}...
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clear}
                  data-ocid="header.logout_button"
                  className="h-9"
                >
                  <LogOut className="w-4 h-4 mr-1" /> Đăng xuất
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={login}
                disabled={loginStatus === "logging-in"}
                data-ocid="header.login_button"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.52 0.22 260), oklch(0.65 0.14 188))",
                }}
                className="text-white border-0 hover:opacity-90 h-9"
              >
                <LogIn className="w-4 h-4 mr-1" />
                {loginStatus === "logging-in" ? "Đang kết nối..." : "Đăng nhập"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// ---- HERO ----
function HeroSection({
  onSearch,
}: { onSearch: (sport: string, location: string) => void }) {
  const [sport, setSport] = useState("");
  const [location, setLocation] = useState("");

  function handleSearch() {
    onSearch(sport, location);
    document.getElementById("matches")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="hero-gradient relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
              <Zap className="w-3 h-3 mr-1" /> Live Matchmaking
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
              Tìm đồng đội,{" "}
              <span className="text-yellow-300">Ra sân thôi!</span>
            </h1>
            <p className="text-base text-white/80 mb-8 max-w-lg">
              Kết nối với các bạn sinh viên yêu thể thao gần bạn. Tham gia trận
              đấu trực tiếp, lấp chỗ trống và thi đấu cùng nhau.
            </p>
            <div className="flex gap-8">
              {[
                { label: "Trận đang mở", value: "120+" },
                { label: "Môn thể thao", value: "10+" },
                { label: "Sinh viên", value: "2K+" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-white/70">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="hidden lg:flex justify-end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(SPORT_CONFIG).map(([name, cfg]) => (
                <div
                  key={name}
                  className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center bg-white/15 backdrop-blur border border-white/20 shadow-lg"
                >
                  <span className="text-3xl">{cfg.emoji}</span>
                  <span className="text-xs text-white/80 mt-1 font-medium">
                    {name}
                  </span>
                </div>
              ))}
              <div className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center bg-white/15 backdrop-blur border border-white/20 shadow-lg">
                <span className="text-3xl">🎯</span>
                <span className="text-xs text-white/80 mt-1 font-medium">
                  More
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search panel */}
        <motion.div
          className="mt-10 bg-foreground/95 backdrop-blur rounded-2xl p-6 shadow-hero max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-4">
            Tìm trận đấu
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={sport} onValueChange={setSport}>
              <SelectTrigger
                data-ocid="hero.select"
                className="bg-white/10 border-white/20 text-white flex-1 min-h-[48px]"
              >
                <SelectValue placeholder="Chọn môn thể thao..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả môn</SelectItem>
                {SPORTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {getSportConfig(s).emoji} {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              data-ocid="hero.search_input"
              placeholder="Địa điểm..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 flex-1 min-h-[48px]"
            />
            <Button
              data-ocid="hero.find_button"
              onClick={handleSearch}
              className="text-white font-semibold px-6 shrink-0 border-0 min-h-[48px]"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.72 0.18 47), oklch(0.80 0.18 80))",
              }}
            >
              <Search className="w-4 h-4 mr-2" /> Tìm ngay
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ---- MATCH CARD (Glassmorphism) ----
function MatchCard({
  match,
  index,
  isNewest,
}: { match: Match; index: number; isNewest: boolean }) {
  const joinMutation = useJoinMatch();
  const cfg = getSportConfig(match.sport);
  const missing = Number(match.missing);
  const imgSrc = `https://loremflickr.com/400/300/${cfg.flickrTag}`;

  async function handleJoin() {
    try {
      await joinMutation.mutateAsync(match.id);
      toast.success("Tham gia trận thành công! 🎉");
    } catch {
      toast.error("Không thể tham gia trận");
    }
  }

  return (
    <motion.div
      data-ocid={`matches.item.${index + 1}`}
      className="match-card-img relative rounded-2xl overflow-hidden cursor-pointer"
      style={{ minHeight: "280px" }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
    >
      {/* Background image */}
      <img
        src={imgSrc}
        alt={match.sport}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

      {/* NEW badge */}
      {isNewest && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-red-500 text-white border-0 text-xs font-bold px-2 py-0.5 animate-pulse">
            🔥 MỚI
          </Badge>
        </div>
      )}

      {/* Sport badge top-right */}
      <div className="absolute top-3 right-3 z-10">
        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs font-semibold">
          {cfg.emoji} {match.sport}
        </Badge>
      </div>

      {/* Card content overlaid on image */}
      <div className="absolute inset-x-0 bottom-0 p-4 glass-card rounded-b-2xl">
        <h3 className="font-bold text-white text-base mb-2 line-clamp-1">
          {match.title}
        </h3>

        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-2 text-xs text-white/80">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{formatDateTime(match.time)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/80">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{match.location}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Users className="w-3.5 h-3.5 shrink-0 text-white/70" />
            <span
              className="font-semibold"
              style={{
                color: missing > 0 ? "#fbbf24" : "#86efac",
              }}
            >
              {missing > 0 ? `${missing} chỗ trống` : "Đã đủ quân"}
            </span>
          </div>
        </div>

        <Button
          data-ocid={`matches.join_button.${index + 1}`}
          onClick={handleJoin}
          disabled={joinMutation.isPending || missing <= 0}
          size="sm"
          className="w-full text-white border-0 font-semibold h-10"
          style={{
            background:
              missing > 0
                ? "linear-gradient(135deg, oklch(0.52 0.22 260), oklch(0.65 0.14 188))"
                : "rgba(255,255,255,0.15)",
          }}
        >
          {joinMutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Đang tham
              gia...
            </>
          ) : missing > 0 ? (
            "Tham gia ngay"
          ) : (
            "Đã đủ quân"
          )}
        </Button>
      </div>
    </motion.div>
  );
}

// ---- SKELETON CARD ----
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ minHeight: "280px" }}>
      <div className="skeleton h-full w-full" style={{ minHeight: "280px" }} />
    </div>
  );
}

// ---- SPORT RANKING ----
function SportRanking({ matches }: { matches: Match[] }) {
  if (matches.length === 0) return null;

  const counts: Record<string, number> = {};
  for (const m of matches) {
    counts[m.sport] = (counts[m.sport] ?? 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  const [sport, count] = top;
  const cfg = getSportConfig(sport);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1.5">
      <span>⭐</span>
      <span className="font-semibold text-yellow-800">
        Môn hot nhất: {cfg.emoji} {sport}
      </span>
      <span className="text-yellow-600">({count} trận)</span>
    </div>
  );
}

// ---- LIVE MATCHES SECTION ----
function LiveMatchesSection({
  filterSport,
  filterLocation,
}: { filterSport: string; filterLocation: string }) {
  const { data: matches, isLoading } = useGetAllMatches();

  const filtered = (matches ?? [])
    .filter((m) => {
      const matchSport =
        !filterSport || m.sport.toLowerCase() === filterSport.toLowerCase();
      const matchLoc =
        !filterLocation ||
        m.location.toLowerCase().includes(filterLocation.toLowerCase());
      return matchSport && matchLoc;
    })
    .sort((a, b) => {
      // Sort by time ascending (nearest first)
      const ta = new Date(a.time).getTime();
      const tb = new Date(b.time).getTime();
      return ta - tb;
    });

  // Find the newest match by createdAt
  const newestId =
    filtered.length > 0
      ? filtered.reduce((prev, curr) =>
          curr.createdAt > prev.createdAt ? curr : prev,
        ).id
      : null;

  return (
    <section
      id="matches"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
    >
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-extrabold uppercase tracking-widest text-foreground">
              Trận Đang Mở
            </h2>
            {!isLoading && (
              <Badge
                className="text-white border-0 font-bold text-sm"
                style={{ background: "oklch(0.52 0.22 260)" }}
              >
                📊 {filtered.length} trận
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Zap className="w-3 h-3" /> Cập nhật tự động
          </div>
        </div>
        {!isLoading && <SportRanking matches={filtered} />}
      </div>

      {isLoading ? (
        <div
          data-ocid="matches.loading_state"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {Array.from({ length: 8 }, (_, i) => i).map((i) => (
            <SkeletonCard key={`skeleton-${i}`} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div data-ocid="matches.empty_state" className="text-center py-20">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Chưa có trận nào
          </h3>
          <p className="text-muted-foreground mb-6">
            Hãy là người đầu tiên tạo trận trong khu vực của bạn!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <AnimatePresence>
            {filtered.map((match, i) => (
              <MatchCard
                key={match.id}
                match={match}
                index={i}
                isNewest={match.id === newestId}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

// ---- CREATE MATCH SECTION ----
function CreateMatchSection({
  sectionRef,
}: { sectionRef: React.RefObject<HTMLElement | null> }) {
  const createMutation = useCreateMatch();
  const [form, setForm] = useState({
    sport: "",
    title: "",
    location: "",
    time: "",
    missing: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.sport) newErrors.sport = "Vui lòng chọn môn thể thao";
    if (!form.location.trim()) newErrors.location = "Vui lòng nhập địa điểm";
    if (!form.time) newErrors.time = "Vui lòng chọn thời gian";
    const missingNum = Number(form.missing);
    if (!form.missing || Number.isNaN(missingNum) || missingNum <= 0) {
      newErrors.missing = "Số người thiếu phải là số nguyên dương";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync({
        sport: form.sport,
        title: form.title || `Trận ${form.sport} tại ${form.location}`,
        location: form.location,
        time: form.time,
        missing: BigInt(Math.round(Number(form.missing))),
      });
      toast.success("Tạo trận thành công! 🎉");
      setForm({ sport: "", title: "", location: "", time: "", missing: "" });
      setErrors({});
      document
        .getElementById("matches")
        ?.scrollIntoView({ behavior: "smooth" });
    } catch {
      toast.error("Không thể tạo trận. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section ref={sectionRef} id="create" className="bg-muted py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <Badge
            className="mb-3 text-white border-0"
            style={{ background: "oklch(0.52 0.22 260)" }}
          >
            <Plus className="w-3 h-3 mr-1" /> Host a Game
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">
            Tạo Trận Của Bạn
          </h2>
          <p className="text-muted-foreground mt-2 text-base">
            Điền thông tin và để mọi người tìm thấy bạn.
          </p>
        </div>

        <form onSubmit={handleSubmit} data-ocid="create.panel">
          <div className="bg-card rounded-2xl shadow-card border border-border p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Sport */}
              <div className="space-y-2">
                <Label htmlFor="sport" className="font-semibold text-sm">
                  Môn thể thao <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.sport}
                  onValueChange={(v) => update("sport", v)}
                >
                  <SelectTrigger
                    id="sport"
                    data-ocid="create.select"
                    className={`w-full min-h-[48px] ${errors.sport ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Chọn môn..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {getSportConfig(s).emoji} {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sport && (
                  <p className="text-xs text-destructive">{errors.sport}</p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="font-semibold text-sm">
                  Tên trận (tuỳ chọn)
                </Label>
                <Input
                  id="title"
                  data-ocid="create.input"
                  placeholder="VD: Bóng đá chiều thứ 6"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  className="min-h-[48px]"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="font-semibold text-sm">
                  Địa điểm <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="Công viên, sân thể thao..."
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                    className={`pl-9 min-h-[48px] ${errors.location ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.location && (
                  <p className="text-xs text-destructive">{errors.location}</p>
                )}
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label htmlFor="time" className="font-semibold text-sm">
                  Ngày & Giờ <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="datetime-local"
                    value={form.time}
                    onChange={(e) => update("time", e.target.value)}
                    className={`pl-9 min-h-[48px] ${errors.time ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.time && (
                  <p className="text-xs text-destructive">{errors.time}</p>
                )}
              </div>

              {/* Missing players */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="missing" className="font-semibold text-sm">
                  Số người thiếu <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="missing"
                    type="number"
                    min="1"
                    max="20"
                    placeholder="Cần thêm bao nhiêu người?"
                    value={form.missing}
                    onChange={(e) => update("missing", e.target.value)}
                    className={`pl-9 min-h-[48px] ${errors.missing ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.missing && (
                  <p className="text-xs text-destructive">{errors.missing}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              data-ocid="create.submit_button"
              disabled={isSubmitting}
              className="w-full mt-8 h-12 text-base font-bold text-white border-0 rounded-xl"
              style={{ background: "oklch(0.18 0.03 220)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang xử
                  lý...
                </>
              ) : (
                <>
                  <Target className="w-5 h-5 mr-2" /> Gửi / Tạo Trận
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

// ---- FOOTER ----
function Footer() {
  const year = new Date().getFullYear();
  const utmLink = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`;

  return (
    <footer
      className="text-white py-12"
      style={{ background: "oklch(0.18 0.03 220)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.52 0.22 260), oklch(0.65 0.14 188))",
                }}
              >
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold">MatchUp</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Nền tảng kết nối thể thao dành cho sinh viên. Tìm trận, lấp chỗ
              trống, thi đấu nhiều hơn.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-white/80 uppercase text-xs tracking-wider">
              Nền tảng
            </h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li>
                <a
                  href="#matches"
                  className="hover:text-white transition-colors"
                >
                  Tìm trận
                </a>
              </li>
              <li>
                <a
                  href="#create"
                  className="hover:text-white transition-colors"
                >
                  Tạo trận
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-white/80 uppercase text-xs tracking-wider">
              Môn thể thao
            </h4>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map((s) => (
                <span
                  key={s}
                  className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70"
                >
                  {getSportConfig(s).emoji} {s}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/50">
          <span>© {year} MatchUp. All rights reserved.</span>
          <span>
            Built with <Heart className="inline w-3 h-3 mx-1 text-red-400" />{" "}
            using{" "}
            <a
              href={utmLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white underline"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

// ---- MOBILE STICKY BOTTOM BAR ----
function MobileStickyBar({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-safe-area-inset-bottom bg-white/95 backdrop-blur border-t border-border py-3">
      <Button
        data-ocid="mobile.create_button"
        onClick={onCreateClick}
        className="w-full h-12 text-white font-bold text-base border-0 rounded-xl"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.52 0.22 260), oklch(0.65 0.14 188))",
        }}
      >
        🏆 Tạo trận ngay
      </Button>
    </div>
  );
}

// ---- APP ----
export default function App() {
  const [filterSport, setFilterSport] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const createSectionRef = useRef<HTMLElement>(null);

  function handleSearch(sport: string, location: string) {
    setFilterSport(sport);
    setFilterLocation(location);
  }

  function scrollToCreate() {
    createSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen flex flex-col pb-16 sm:pb-0">
      <Toaster position="top-right" />
      <Header onCreateClick={scrollToCreate} />
      <main className="flex-1">
        <HeroSection onSearch={handleSearch} />
        <LiveMatchesSection
          filterSport={filterSport}
          filterLocation={filterLocation}
        />
        <CreateMatchSection sectionRef={createSectionRef} />
      </main>
      <Footer />
      <MobileStickyBar onCreateClick={scrollToCreate} />
    </div>
  );
}
