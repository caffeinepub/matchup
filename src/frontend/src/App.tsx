import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  Heart,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  Moon,
  Pencil,
  Plus,
  Search,
  Sun,
  Target,
  Trophy,
  User,
  Users,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Match, MatchEntry, Message, ProfileEntry } from "./backend.d";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useCreateMatch,
  useGetAllMatches,
  useGetAllProfiles,
  useGetMessages,
  useGetMyMatches,
  useGetMyProfile,
  useJoinMatch,
  useMatchWithUser,
  useSendMessage,
  useUpdateMyProfile,
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

// ---- DARK MODE HOOK ----
function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleDark = () => setIsDark((prev) => !prev);
  return { isDark, toggleDark };
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

// ---- PROFILE SHEET ----
function ProfileSheet({
  open,
  onOpenChange,
  isLoggedIn,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoggedIn: boolean;
}) {
  const { data: profile, isLoading } = useGetMyProfile(isLoggedIn);
  const updateMutation = useUpdateMyProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    avatarUrl: "",
    skills: "",
  });

  // Sync form when profile loads or sheet opens
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        skills: profile.skills.join(", "),
      });
    }
  }, [profile]);

  function startEdit() {
    setForm({
      name: profile?.name ?? "",
      bio: profile?.bio ?? "",
      avatarUrl: profile?.avatarUrl ?? "",
      skills: (profile?.skills ?? []).join(", "),
    });
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
  }

  async function handleSave() {
    try {
      await updateMutation.mutateAsync({
        name: form.name.trim(),
        bio: form.bio.trim(),
        avatarUrl: form.avatarUrl.trim(),
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      toast.success("Đã lưu hồ sơ!");
      setIsEditing(false);
    } catch {
      toast.error("Không thể lưu hồ sơ. Vui lòng thử lại.");
    }
  }

  const displayName = profile?.name || "Chưa có tên";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-ocid="profile.sheet"
        className="w-full sm:max-w-md overflow-y-auto"
        side="right"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold">Hồ Sơ Cá Nhân</SheetTitle>
          <SheetDescription className="text-muted-foreground text-sm">
            Thông tin cá nhân của bạn trên MatchUp
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div
            data-ocid="profile.loading_state"
            className="flex flex-col items-center gap-4 py-12"
          >
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Đang tải hồ sơ...</p>
          </div>
        ) : isEditing ? (
          // ---- EDIT FORM ----
          <motion.div
            data-ocid="profile.panel"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="profile-name" className="font-semibold text-sm">
                Tên
              </Label>
              <Input
                id="profile-name"
                data-ocid="profile.input"
                placeholder="Nguyễn Văn A"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-bio" className="font-semibold text-sm">
                Giới thiệu
              </Label>
              <Textarea
                id="profile-bio"
                data-ocid="profile.textarea"
                placeholder="Mô tả ngắn về bản thân..."
                value={form.bio}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, bio: e.target.value }))
                }
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-avatar" className="font-semibold text-sm">
                URL ảnh đại diện
              </Label>
              <Input
                id="profile-avatar"
                data-ocid="profile.avatar_input"
                placeholder="https://..."
                value={form.avatarUrl}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, avatarUrl: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-skills" className="font-semibold text-sm">
                Kỹ năng (cách nhau bởi dấu phẩy)
              </Label>
              <Input
                id="profile-skills"
                data-ocid="profile.skills_input"
                placeholder="Soccer, Basketball, Teamwork..."
                value={form.skills}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, skills: e.target.value }))
                }
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                data-ocid="profile.save_button"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex-1 rounded-full font-semibold text-white border-0"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.52 0.22 260), oklch(0.65 0.14 188))",
                }}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang
                    lưu...
                  </>
                ) : (
                  "Lưu"
                )}
              </Button>
              <Button
                data-ocid="profile.cancel_button"
                variant="outline"
                onClick={cancelEdit}
                className="flex-1 rounded-full font-semibold"
              >
                <X className="w-4 h-4 mr-1" /> Hủy
              </Button>
            </div>
          </motion.div>
        ) : (
          // ---- VIEW MODE ----
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Avatar + Name */}
            <div className="flex flex-col items-center gap-4 py-4">
              <Avatar className="w-24 h-24 border-4 border-border shadow-lg">
                {profile?.avatarUrl ? (
                  <AvatarImage src={profile.avatarUrl} alt={displayName} />
                ) : null}
                <AvatarFallback
                  className="text-2xl font-bold"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.52 0.22 260), oklch(0.65 0.14 188))",
                    color: "white",
                  }}
                >
                  {profile?.name ? initials : <User className="w-10 h-10" />}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground">
                  {displayName}
                </h3>
              </div>
            </div>

            <Separator />

            {/* Bio */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Giới thiệu
              </p>
              {profile?.bio ? (
                <p className="text-sm text-foreground leading-relaxed">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Chưa có giới thiệu
                </p>
              )}
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kỹ năng
              </p>
              {profile?.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill: string) => (
                    <Badge
                      key={skill}
                      className="text-white border-0 text-xs font-medium"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.52 0.22 260), oklch(0.65 0.14 188))",
                      }}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Chưa có kỹ năng
                </p>
              )}
            </div>

            <Separator />

            <Button
              data-ocid="profile.edit_button"
              onClick={startEdit}
              variant="outline"
              className="w-full rounded-full font-semibold"
            >
              <Pencil className="w-4 h-4 mr-2" /> Chỉnh sửa
            </Button>
          </motion.div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ---- HEADER ----
function Header({
  onCreateClick,
  onProfileClick,
  isDark,
  toggleDark,
}: {
  onCreateClick: () => void;
  onProfileClick: () => void;
  isDark: boolean;
  toggleDark: () => void;
}) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (loginStatus === "success") {
      setIsLoggingIn(false);
      setLoginError(null);
    }
  }, [loginStatus]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await login();
    } catch (err) {
      console.error("Login failed:", err);
      setLoginError("Đăng nhập thất bại. Vui lòng thử lại.");
      setIsLoggingIn(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-background/95 backdrop-blur border-b border-border shadow-xs transition-colors duration-300">
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
            <span className="text-2xl font-bold text-foreground tracking-tight">
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
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full cursor-pointer"
            >
              Tạo trận
            </button>
          </nav>

          {/* Auth + Connection + Dark Toggle */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-3">
              <ConnectionStatus />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDark}
                data-ocid="header.theme_toggle"
                className="rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                aria-label="Toggle dark mode"
              >
                {isDark ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
              {isLoggedIn ? (
                <>
                  <span className="hidden sm:block text-xs text-muted-foreground truncate max-w-[100px]">
                    {identity.getPrincipal().toString().slice(0, 10)}...
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onProfileClick}
                    data-ocid="header.profile_button"
                    className="h-9 rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                  >
                    <User className="w-4 h-4 mr-1" /> Hồ sơ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clear}
                    data-ocid="header.logout_button"
                    className="h-9 rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                  >
                    <LogOut className="w-4 h-4 mr-1" /> Đăng xuất
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={handleLogin}
                  disabled={isLoggingIn || loginStatus === "logging-in"}
                  data-ocid="header.login_button"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.52 0.22 260), oklch(0.65 0.14 188))",
                  }}
                  className="text-white border-0 hover:opacity-90 h-9 rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  {isLoggingIn || loginStatus === "logging-in"
                    ? "Đang đăng nhập..."
                    : "Đăng nhập"}
                </Button>
              )}
            </div>
            {loginError && (
              <p className="text-xs text-red-500 mt-1">{loginError}</p>
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
  const [sport, setSport] = useState("all");
  const [location, setLocation] = useState("");

  function handleSearch() {
    onSearch(sport === "all" ? "" : sport, location);
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
            <h1 className="font-display text-5xl lg:text-7xl font-extrabold text-white leading-tight mb-4">
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
                  className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center bg-white/15 backdrop-blur border border-white/20 shadow-lg transition-all duration-200 hover:scale-[1.05] hover:bg-white/20"
                >
                  <span className="text-3xl">{cfg.emoji}</span>
                  <span className="text-xs text-white/80 mt-1 font-medium">
                    {name}
                  </span>
                </div>
              ))}
              <div className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center bg-white/15 backdrop-blur border border-white/20 shadow-lg transition-all duration-200 hover:scale-[1.05] hover:bg-white/20">
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
                <SelectItem value="all">Tất cả môn</SelectItem>
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
              className="text-white font-semibold px-6 shrink-0 border-0 min-h-[48px] rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
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
      className="group match-card-img relative rounded-2xl overflow-hidden cursor-pointer"
      style={{ minHeight: "280px" }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
    >
      {/* Background image */}
      <img
        src={imgSrc}
        alt={match.sport}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
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
      <div
        className="absolute inset-x-0 bottom-0 p-5 glass-card rounded-b-2xl"
        style={{ borderTop: `2px solid ${cfg.color}` }}
      >
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
          className="w-full text-white border-0 font-semibold h-10 rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
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
    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-700/40 dark:text-yellow-300 rounded-full px-3 py-1.5">
      <span>⭐</span>
      <span className="font-semibold text-yellow-800 dark:text-yellow-300">
        Môn hot nhất: {cfg.emoji} {sport}
      </span>
      <span className="text-yellow-600 dark:text-yellow-400">
        ({count} trận)
      </span>
    </div>
  );
}

// ---- FIND PLAYERS SECTION ----
function FindPlayersSection({
  identity,
}: { identity: { getPrincipal: () => { toString: () => string } } }) {
  const callerPrincipal = identity.getPrincipal().toString();
  const { data: profiles = [], isLoading } = useGetAllProfiles(true);
  const { data: myMatches = [] } = useGetMyMatches(true);
  const matchMutation = useMatchWithUser();

  const matchedSet = new Set(
    myMatches.map((m: MatchEntry) => m.matched.toString()),
  );
  const mutualSet = new Set(
    myMatches
      .filter((m: MatchEntry) => m.mutual)
      .map((m: MatchEntry) => m.matched.toString()),
  );

  const others = profiles.filter(
    (p: ProfileEntry) => p.owner.toString() !== callerPrincipal,
  );

  function getInitials(name: string) {
    return (
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "?"
    );
  }

  return (
    <section className="py-10 px-4 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
        <span>🏃</span> Find Players
      </h2>

      {isLoading ? (
        <div
          data-ocid="players.loading_state"
          className="flex gap-4 overflow-x-auto pb-2"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-56 h-48 rounded-2xl bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : others.length === 0 ? (
        <div
          data-ocid="players.empty_state"
          className="text-center py-12 text-muted-foreground"
        >
          <p className="text-lg">No players found yet.</p>
          <p className="text-sm mt-1">Set up your profile to appear here!</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
          {others.map((entry: ProfileEntry, idx: number) => {
            const ownerStr = entry.owner.toString();
            const isMatched = matchedSet.has(ownerStr);
            const isMutual = mutualSet.has(ownerStr);
            const isPending =
              matchMutation.isPending &&
              matchMutation.variables?.toString() === ownerStr;

            return (
              <div
                key={ownerStr}
                data-ocid={`players.item.${idx + 1}`}
                className="flex-shrink-0 w-56 snap-start rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow"
              >
                {isMutual && (
                  <Badge className="self-start bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 text-xs">
                    🤝 Mutual
                  </Badge>
                )}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {entry.profile.avatarUrl ? (
                      <AvatarImage
                        src={entry.profile.avatarUrl}
                        alt={entry.profile.name}
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {getInitials(entry.profile.name || ownerStr)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {entry.profile.name || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {entry.profile.bio || "No bio yet"}
                    </p>
                  </div>
                </div>
                {entry.profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.profile.skills.slice(0, 3).map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-xs px-2 py-0"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
                <Button
                  data-ocid={`players.button.${idx + 1}`}
                  size="sm"
                  variant={isMatched ? "outline" : "default"}
                  disabled={isMatched || isPending}
                  className={
                    isMatched
                      ? "text-green-600 dark:text-green-400 border-green-500/40"
                      : ""
                  }
                  onClick={() => matchMutation.mutate(entry.owner)}
                >
                  {isPending
                    ? "Matching…"
                    : isMatched
                      ? "✓ Matched!"
                      : "Match ✓"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </section>
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
      const ta = new Date(a.time).getTime();
      const tb = new Date(b.time).getTime();
      return ta - tb;
    });

  const newestId =
    filtered.length > 0
      ? filtered.reduce((prev, curr) =>
          curr.createdAt > prev.createdAt ? curr : prev,
        ).id
      : null;

  return (
    <section
      id="matches"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
    >
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-display text-3xl font-extrabold uppercase tracking-widest text-foreground">
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
    sport: "none",
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
    if (!form.sport || form.sport === "none")
      newErrors.sport = "Vui lòng chọn môn thể thao";
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
      setForm({
        sport: "none",
        title: "",
        location: "",
        time: "",
        missing: "",
      });
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
    <section ref={sectionRef} id="create" className="bg-muted py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <Badge
            className="mb-3 text-white border-0"
            style={{ background: "oklch(0.52 0.22 260)" }}
          >
            <Plus className="w-3 h-3 mr-1" /> Host a Game
          </Badge>
          <h2 className="font-display text-3xl font-extrabold text-foreground">
            Tạo Trận Của Bạn
          </h2>
          <p className="text-muted-foreground mt-2 text-base">
            Điền thông tin và để mọi người tìm thấy bạn.
          </p>
        </div>

        <form onSubmit={handleSubmit} data-ocid="create.panel">
          <div className="bg-card dark:bg-card dark:border-border rounded-2xl shadow-card border border-border p-8 md:p-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
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
              className="w-full mt-8 h-12 text-base font-bold text-white border-0 rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
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
      className="text-white py-16"
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
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-safe-area-inset-bottom bg-white/95 dark:bg-background/95 backdrop-blur border-t border-border dark:border-border py-3 transition-colors duration-300">
      <Button
        data-ocid="mobile.create_button"
        onClick={onCreateClick}
        className="w-full h-12 text-white font-bold text-base border-0 rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
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

// ---- CHAT SECTION ----
function ChatSection({
  identity,
}: { identity: { getPrincipal: () => { toString: () => string } } }) {
  const callerPrincipal = identity.getPrincipal().toString();
  const { data: myMatches = [] } = useGetMyMatches(true);
  const [selectedContact, setSelectedContact] = useState<MatchEntry | null>(
    null,
  );
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const mutualMatches = myMatches.filter((m: MatchEntry) => m.mutual);

  const { data: messages = [], isLoading: loadingMessages } = useGetMessages(
    selectedContact?.matched ?? null,
    !!selectedContact,
  );
  const sendMutation = useSendMessage();

  const messagesLen = messages.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message count change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesLen]);

  function getInitials(name: string) {
    return (
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "?"
    );
  }

  function handleSend() {
    if (!text.trim() || !selectedContact) return;
    sendMutation.mutate(
      { to: selectedContact.matched, text: text.trim() },
      { onSuccess: () => setText("") },
    );
  }

  function handleKeyDown(e: import("react").KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <section className="py-10 px-4 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
        <span>💬</span> Tin nhắn
      </h2>

      {mutualMatches.length === 0 ? (
        <div
          data-ocid="chat.empty_state"
          className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-2xl"
        >
          <p className="text-lg">Chưa có kết nối nào.</p>
          <p className="text-sm mt-1">
            Kết nối với người chơi để bắt đầu nhắn tin!
          </p>
        </div>
      ) : (
        <div className="flex gap-4 h-[420px] border border-border rounded-2xl overflow-hidden bg-card/60 backdrop-blur-sm shadow-sm">
          {/* Contact list */}
          <div className="w-56 flex-shrink-0 border-r border-border overflow-y-auto">
            {mutualMatches.map((m: MatchEntry, idx: number) => {
              const isSelected =
                selectedContact?.matched.toString() === m.matched.toString();
              return (
                <button
                  type="button"
                  key={m.matched.toString()}
                  data-ocid={`chat.item.${idx + 1}`}
                  onClick={() => setSelectedContact(m)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors ${isSelected ? "bg-primary/10 border-r-2 border-primary" : ""}`}
                >
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    {m.profile.avatarUrl ? (
                      <AvatarImage
                        src={m.profile.avatarUrl}
                        alt={m.profile.name}
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                      {getInitials(m.profile.name || m.matched.toString())}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate text-foreground">
                    {m.profile.name || `${m.matched.toString().slice(0, 8)}...`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Message thread */}
          {selectedContact ? (
            <div className="flex-1 flex flex-col min-w-0">
              <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-muted/30">
                <Avatar className="h-8 w-8">
                  {selectedContact.profile.avatarUrl ? (
                    <AvatarImage
                      src={selectedContact.profile.avatarUrl}
                      alt={selectedContact.profile.name}
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                    {getInitials(
                      selectedContact.profile.name ||
                        selectedContact.matched.toString(),
                    )}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm text-foreground">
                  {selectedContact.profile.name ||
                    `${selectedContact.matched.toString().slice(0, 10)}...`}
                </span>
              </div>

              <div
                ref={scrollRef}
                data-ocid="chat.panel"
                className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2"
              >
                {loadingMessages ? (
                  <div
                    data-ocid="chat.loading_state"
                    className="flex items-center justify-center h-full text-muted-foreground text-sm"
                  >
                    Đang tải...
                  </div>
                ) : messages.length === 0 ? (
                  <div
                    data-ocid="chat.empty_state"
                    className="flex items-center justify-center h-full text-muted-foreground text-sm"
                  >
                    Hãy bắt đầu cuộc trò chuyện!
                  </div>
                ) : (
                  messages.map((msg: Message) => {
                    const isMine = msg.from.toString() === callerPrincipal;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                            isMine
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-4 py-3 border-t border-border flex gap-2">
                <Input
                  data-ocid="chat.input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1"
                />
                <Button
                  data-ocid="chat.submit_button"
                  onClick={handleSend}
                  disabled={!text.trim() || sendMutation.isPending}
                  size="sm"
                >
                  Gửi
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Chọn người để nhắn tin
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ---- APP ----
export default function App() {
  const [filterSport, setFilterSport] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const createSectionRef = useRef<HTMLElement>(null);
  const { isDark, toggleDark } = useDarkMode();
  const { loginStatus, identity } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;

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
      <Header
        onCreateClick={scrollToCreate}
        onProfileClick={() => setProfileOpen(true)}
        isDark={isDark}
        toggleDark={toggleDark}
      />
      <ProfileSheet
        open={profileOpen}
        onOpenChange={setProfileOpen}
        isLoggedIn={isLoggedIn}
      />
      <motion.main
        className="flex-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <HeroSection onSearch={handleSearch} />
        {isLoggedIn && identity && <FindPlayersSection identity={identity} />}
        {isLoggedIn && identity && <ChatSection identity={identity} />}
        <LiveMatchesSection
          filterSport={filterSport}
          filterLocation={filterLocation}
        />
        <CreateMatchSection sectionRef={createSectionRef} />
      </motion.main>
      <Footer />
      <MobileStickyBar onCreateClick={scrollToCreate} />
    </div>
  );
}
