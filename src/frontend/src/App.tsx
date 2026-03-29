import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Bell,
  Calendar,
  Clock,
  Filter,
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
import { ChatSection } from "./ChatSection";
import type { Match, MatchEntry, ProfileEntry } from "./backend.d";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { type Notification, useNotifications } from "./hooks/useNotifications";
import {
  useCreateMatch,
  useGetAllMatches,
  useGetAllProfiles,
  useGetMyMatches,
  useGetMyProfile,
  useJoinMatch,
  useMatchWithUser,
  useRegisterMe,
  useSendMessage,
  useUpdateMyProfile,
} from "./hooks/useQueries";

const SPORTS = [
  "Soccer",
  "Basketball",
  "Tennis",
  "Volleyball",
  "Badminton",
  "Swimming",
  "Running",
  "Cycling",
  "Table Tennis",
  "Futsal",
];

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
  Swimming: {
    band: "sport-band-swimming",
    emoji: "🏊",
    color: "#06B6D4",
    flickrTag: "swimming",
  },
  Running: {
    band: "sport-band-running",
    emoji: "🏃",
    color: "#F59E0B",
    flickrTag: "running",
  },
  Cycling: {
    band: "sport-band-cycling",
    emoji: "🚴",
    color: "#10B981",
    flickrTag: "cycling",
  },
  "Table Tennis": {
    band: "sport-band-tabletennis",
    emoji: "🏓",
    color: "#EC4899",
    flickrTag: "tabletennis",
  },
  Futsal: {
    band: "sport-band-futsal",
    emoji: "🥅",
    color: "#8B5CF6",
    flickrTag: "futsal",
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
  const { mutateAsync: ensureRegistered } = useRegisterMe();
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
      await ensureRegistered();
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
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
                Ảnh đại diện
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="profile-avatar"
                  data-ocid="profile.avatar_input"
                  placeholder="Nhập URL ảnh hoặc tạo tự động..."
                  value={form.avatarUrl}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, avatarUrl: e.target.value }))
                  }
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs px-3"
                  onClick={() => {
                    const seed =
                      form.name.trim() || Math.random().toString(36).slice(2);
                    const url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
                    setForm((prev) => ({ ...prev, avatarUrl: url }));
                  }}
                >
                  🎲 Tạo tự động
                </Button>
              </div>
              {form.avatarUrl && (
                <img
                  src={form.avatarUrl}
                  alt="preview"
                  className="w-16 h-16 rounded-full object-cover border border-border mt-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                  onLoad={(e) => {
                    (e.target as HTMLImageElement).style.display = "block";
                  }}
                />
              )}
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
              <Avatar className="w-28 h-28 border-4 border-border shadow-xl">
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

// ---- NOTIFICATION BELL ----
function NotificationBell({
  notifications,
  unreadCount,
  markAllRead,
  clearAll,
}: {
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  clearAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  function formatTime(ts: number) {
    const diff = Date.now() - ts;
    if (diff < 60000) return "Vừa xong";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
    return new Date(ts).toLocaleDateString("vi-VN");
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        data-ocid="header.notification_button"
        className="rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] relative"
        aria-label="Thông báo"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1"
            data-ocid="header.notification_badge"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            data-ocid="header.notification_panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full mt-2 z-50 min-w-72 w-80 rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-semibold text-sm">Thông báo</span>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={markAllRead}
                      data-ocid="header.notification_mark_read"
                      className="text-xs text-blue-500 hover:underline cursor-pointer"
                    >
                      Đánh dấu đã đọc
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      data-ocid="header.notification_clear"
                      className="text-xs text-muted-foreground hover:underline cursor-pointer"
                    >
                      Xóa tất cả
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <div
                  data-ocid="header.notification_empty_state"
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Chưa có thông báo nào
                </div>
              ) : (
                notifications.map((n, i) => (
                  <div
                    key={n.id}
                    data-ocid={`header.notification.item.${i + 1}`}
                    className={`px-4 py-3 text-sm transition-colors ${
                      n.read
                        ? "bg-transparent"
                        : "bg-blue-50/60 dark:bg-blue-950/20 border-l-2 border-l-blue-400"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {n.title}
                        </p>
                        <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
                          {n.body}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5 shrink-0">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- HEADER ----
function Header({
  onCreateClick,
  onProfileClick,
  isDark,
  toggleDark,
  notifications,
  unreadCount,
  markAllRead,
  clearAll,
}: {
  onCreateClick: () => void;
  onProfileClick: () => void;
  isDark: boolean;
  toggleDark: () => void;
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  clearAll: () => void;
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
    <header className="sticky top-0 z-50 bg-white dark:bg-background border-b border-border shadow-xs transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
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
            <span className="text-2xl font-bold tracking-tight brand-gradient-text">
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
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                markAllRead={markAllRead}
                clearAll={clearAll}
              />
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

const SPORT_DESCRIPTIONS: Record<string, string> = {
  Soccer:
    "Môn thể thao vua với 11 người mỗi đội, kết hợp kỹ thuật cá nhân và teamwork.",
  Basketball: "Môn bóng rổ nhanh, cần phối hợp đồng đội và kỹ năng ném bóng.",
  Tennis:
    "Môn thể thao đối kháng cá nhân hoặc đôi, đòi hỏi sức bền và kỹ thuật.",
  Volleyball:
    "Môn bóng chuyền cần teamwork và phản xạ tốt, phổ biến trong sinh viên.",
  Badminton: "Cầu lông nhẹ nhàng nhưng đầy tốc độ, phù hợp mọi lứa tuổi.",
  Swimming: "Bơi lội rèn luyện toàn thân, an toàn và hiệu quả cho sức khỏe.",
  Running: "Chạy bộ đơn giản nhưng hiệu quả cao, nâng cao sức bền và tim mạch.",
  Cycling: "Đạp xe kết hợp thể thao và khám phá, thân thiện với môi trường.",
  "Table Tennis":
    "Bóng bàn đòi hỏi phản xạ siêu nhanh và chiến thuật thông minh.",
  Futsal: "Futsal sân nhỏ, nhịp độ cao, kỹ thuật tinh tế và cần phối hợp tốt.",
};

const SPORT_VIDEOS: Record<string, string> = {
  Soccer: "https://www.youtube.com/watch?v=3STnNa8YPgY",
  Basketball: "https://www.youtube.com/watch?v=xjIGSdHNiF0",
  Tennis: "https://www.youtube.com/watch?v=x3RWXxGqOns",
  Volleyball: "https://www.youtube.com/watch?v=u8nQa1cT8pQ",
  Badminton: "https://www.youtube.com/watch?v=QD9v_4oNNB4",
  Swimming: "https://www.youtube.com/watch?v=5HLW2AI0ZdA",
  Running: "https://www.youtube.com/watch?v=brFHyOtTwH4",
  Cycling: "https://www.youtube.com/watch?v=uuTATLVVaYY",
  "Table Tennis": "https://www.youtube.com/watch?v=6kCzQgxPNQM",
  Futsal: "https://www.youtube.com/watch?v=D5yfq1QBLXU",
};

function SportDetailModal({
  sport,
  onClose,
}: {
  sport: string | null;
  onClose: () => void;
}) {
  const cfg = sport ? getSportConfig(sport) : null;
  const description = sport ? (SPORT_DESCRIPTIONS[sport] ?? "") : "";
  const videoUrl = sport ? (SPORT_VIDEOS[sport] ?? "") : "";

  return (
    <Dialog
      open={!!sport}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto p-0"
        data-ocid="sport_detail.modal"
      >
        {sport && cfg && (
          <>
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                <span className="text-4xl">{cfg.emoji}</span>
                <span style={{ color: cfg.color }}>{sport}</span>
              </DialogTitle>
              <p className="text-muted-foreground text-sm mt-1">
                {description}
              </p>
            </DialogHeader>

            <div className="px-6 pb-4 space-y-5">
              {/* Images grid */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((lock) => (
                  <div
                    key={lock}
                    className="rounded-xl overflow-hidden aspect-square bg-muted"
                  >
                    <img
                      src={`https://loremflickr.com/400/400/${cfg.flickrTag}?lock=${lock}`}
                      alt={`${sport} ${lock}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* YouTube video link */}
              {videoUrl && (
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 py-3.5 font-semibold transition-colors"
                >
                  <svg
                    className="w-6 h-6 shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  Xem video trên YouTube
                </a>
              )}

              {/* CTA */}
              <Button
                data-ocid="sport_detail.primary_button"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl"
                onClick={() => {
                  onClose();
                  setTimeout(
                    () =>
                      document
                        .getElementById("create")
                        ?.scrollIntoView({ behavior: "smooth" }),
                    150,
                  );
                }}
              >
                🏅 Tạo trận ngay
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function HeroSection({
  onSearch,
}: { onSearch: (sport: string, location: string) => void }) {
  const [sport, setSport] = useState("all");
  const [location, setLocation] = useState("");
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
              <Zap className="w-3 h-3 mr-1" /> Live Matchmaking
            </Badge>
            <h1 className="font-display text-6xl lg:text-8xl font-extrabold text-white leading-tight mb-4">
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
                <button
                  key={name}
                  type="button"
                  data-ocid="hero.sport_card"
                  onClick={() => setSelectedSport(name)}
                  className="w-28 h-28 rounded-2xl flex flex-col items-center justify-center bg-white/20 backdrop-blur-md border border-white/25 shadow-xl transition-all duration-300 hover:scale-[1.08] hover:bg-white/28 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <span className="text-3xl">{cfg.emoji}</span>
                  <span className="text-xs text-white/80 mt-1 font-medium">
                    {name}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        <SportDetailModal
          sport={selectedSport}
          onClose={() => setSelectedSport(null)}
        />

        {/* Search panel */}
        <motion.div
          className="mt-10 bg-black/40 backdrop-blur-xl rounded-2xl p-6 shadow-2xl max-w-2xl border border-white/10"
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
                  "linear-gradient(135deg, oklch(0.72 0.2 47), oklch(0.82 0.2 80))",
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
      className="group match-card-img relative rounded-3xl overflow-hidden cursor-pointer"
      style={{ minHeight: "280px" }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.07,
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Background image */}
      <img
        src={imgSrc}
        alt={match.sport}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
        loading="lazy"
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

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
        className="absolute inset-x-0 bottom-0 p-6 glass-card rounded-b-3xl"
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

// ---- MATCH REASON HELPER ----
function getMatchReasons(mySkills: string[], theirSkills: string[]): string {
  const mine = mySkills.map((s) => s.trim().toLowerCase());
  const theirs = theirSkills.map((s) => s.trim().toLowerCase());
  const shared = mine.filter((s) => theirs.includes(s));
  if (shared.length === 0) return "Expand your network";
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  if (shared.length === 1) return `You both like ${capitalize(shared[0])}`;
  return `Shared: ${shared.slice(0, 2).map(capitalize).join(", ")}`;
}

// ---- MATCH PERCENT HELPER ----
function calculateMatchPercent(
  mySkills: string[],
  theirSkills: string[],
): number {
  if (mySkills.length === 0 && theirSkills.length === 0) return 50;
  const mine = mySkills.map((s) => s.trim().toLowerCase());
  const theirs = theirSkills.map((s) => s.trim().toLowerCase());
  const shared = mine.filter((s) => theirs.includes(s));
  const total = new Set([...mine, ...theirs]).size;
  if (total === 0) return 50;
  const base = Math.round((shared.length / total) * 100);
  // Scale to 30-99 range to feel realistic
  return Math.max(30, Math.min(99, base + 30));
}

// ---- TODAY'S MATCHES SECTION ----
function TodayMatchesSection({
  identity,
}: { identity: { getPrincipal: () => { toString: () => string } } }) {
  const callerPrincipal = identity.getPrincipal().toString();
  const { data: profiles = [], isLoading } = useGetAllProfiles(true);
  const { data: myProfile } = useGetMyProfile(true);
  const { data: myMatches = [] } = useGetMyMatches(true);
  const matchMutation = useMatchWithUser();

  const mySkills = myProfile?.skills ?? [];
  const matchedSet = new Set(
    myMatches.map((m: MatchEntry) => m.matched.toString()),
  );
  const mutualSet = new Set(
    myMatches
      .filter((m: MatchEntry) => m.mutual)
      .map((m: MatchEntry) => m.matched.toString()),
  );

  // Seed daily picks using today's date string so they refresh each day
  const todayStr = new Date().toISOString().slice(0, 10);
  const others = profiles.filter(
    (p: ProfileEntry) => p.owner.toString() !== callerPrincipal,
  );
  const dailySuggestions = (() => {
    if (others.length === 0) return [];
    // Simple deterministic shuffle with date seed
    const seed = todayStr
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const shuffled = [...others].sort((a, b) => {
      const ha = (a.owner.toString().charCodeAt(0) * seed) % 997;
      const hb = (b.owner.toString().charCodeAt(0) * seed) % 997;
      return ha - hb;
    });
    return shuffled.slice(0, 3);
  })();

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
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <span>✨</span> Today's Matches
        </h2>
        <Badge variant="secondary" className="text-xs font-medium">
          {todayStr}
        </Badge>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : dailySuggestions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No suggestions yet.</p>
          <p className="text-sm mt-1">
            More players will appear as others join!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {dailySuggestions.map((entry: ProfileEntry) => {
            const ownerStr = entry.owner.toString();
            const isMatched = matchedSet.has(ownerStr);
            const isMutual = mutualSet.has(ownerStr);
            const isPending =
              matchMutation.isPending &&
              matchMutation.variables?.toString() === ownerStr;
            const pct = calculateMatchPercent(mySkills, entry.profile.skills);
            const reason = getMatchReasons(mySkills, entry.profile.skills);
            const pctColor =
              pct >= 70
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : pct >= 50
                  ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30"
                  : "bg-muted text-muted-foreground";

            return (
              <div
                key={ownerStr}
                className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/70 backdrop-blur-sm p-5 flex flex-col gap-3 card-hover-glow"
              >
                <div className="flex items-center justify-between">
                  {isMutual ? (
                    <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 text-xs">
                      🤝 Mutual
                    </Badge>
                  ) : (
                    <span />
                  )}
                  <Badge className={`text-xs font-bold ${pctColor}`}>
                    {pct}% match
                  </Badge>
                </div>
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
                <p className="text-xs font-medium flex items-center gap-1 bg-primary/10 text-primary rounded-md px-2 py-0.5">
                  <span>💡</span> {reason}
                </p>
                <Button
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

// ---- FIND PLAYERS SECTION ----
function FindPlayersSection({
  identity,
}: { identity: { getPrincipal: () => { toString: () => string } } }) {
  const callerPrincipal = identity.getPrincipal().toString();
  const { data: profiles = [], isLoading } = useGetAllProfiles(true);
  const { data: myMatches = [] } = useGetMyMatches(true);
  const { data: myProfile } = useGetMyProfile(true);
  const mySkills = myProfile?.skills ?? [];
  const matchMutation = useMatchWithUser();

  const matchedSet = new Set(
    myMatches.map((m: MatchEntry) => m.matched.toString()),
  );
  const mutualSet = new Set(
    myMatches
      .filter((m: MatchEntry) => m.mutual)
      .map((m: MatchEntry) => m.matched.toString()),
  );

  const [filterSkills, setFilterSkills] = useState<string[]>([]);

  const others = profiles.filter(
    (p: ProfileEntry) => p.owner.toString() !== callerPrincipal,
  );

  const allSkills: string[] = (
    [
      ...new Set(profiles.flatMap((p: ProfileEntry) => p.profile.skills)),
    ] as string[]
  ).sort();

  const filtered =
    filterSkills.length === 0
      ? others
      : others.filter((p: ProfileEntry) =>
          p.profile.skills.some((s) => filterSkills.includes(s)),
        );

  function toggleSkill(skill: string) {
    setFilterSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  }

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
      <h2 className="text-3xl font-bold tracking-tight mb-6 text-foreground flex items-center gap-2">
        <span>🏃</span> Find Players
      </h2>

      {allSkills.length > 0 && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filter by Skills / Interests:</span>
          </div>
          <div className="flex flex-wrap gap-2" data-ocid="players.tab">
            {allSkills.map((skill) => (
              <Badge
                key={skill}
                variant={filterSkills.includes(skill) ? "default" : "outline"}
                className="cursor-pointer select-none hover:opacity-80 transition-opacity"
                onClick={() => toggleSkill(skill)}
                data-ocid="players.toggle"
              >
                {skill}
              </Badge>
            ))}
            <Badge
              variant="outline"
              className="cursor-not-allowed opacity-40 select-none"
              title="Goals field is not available yet"
            >
              Goals (coming soon)
            </Badge>
          </div>
          {filterSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Active:</span>
              {filterSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
              <button
                type="button"
                className="text-xs text-primary hover:underline ml-1"
                onClick={() => setFilterSkills([])}
                data-ocid="players.secondary_button"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

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
      ) : filtered.length === 0 ? (
        <div
          data-ocid="players.empty_state"
          className="text-center py-12 text-muted-foreground"
        >
          <p className="text-lg">No players match your filters.</p>
          <button
            type="button"
            className="text-sm text-primary hover:underline mt-2"
            onClick={() => setFilterSkills([])}
            data-ocid="players.secondary_button"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
          {filtered.map((entry: ProfileEntry, idx: number) => {
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
                className="flex-shrink-0 w-56 snap-start rounded-2xl border border-border bg-gradient-to-br from-card to-card/70 backdrop-blur-sm p-4 flex flex-col gap-3 card-hover-glow"
              >
                <div className="flex items-center gap-2">
                  {isMutual && (
                    <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 text-xs">
                      🤝 Mutual
                    </Badge>
                  )}
                  {(() => {
                    const pct = calculateMatchPercent(
                      mySkills,
                      entry.profile.skills,
                    );
                    const color =
                      pct >= 70
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : pct >= 50
                          ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30"
                          : "bg-muted text-muted-foreground";
                    return (
                      <Badge className={`ml-auto text-xs font-bold ${color}`}>
                        {pct}% match
                      </Badge>
                    );
                  })()}
                </div>
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
                {(() => {
                  const reason = getMatchReasons(
                    mySkills,
                    entry.profile.skills,
                  );
                  const isShared =
                    reason.startsWith("You both like") ||
                    reason.startsWith("Shared:");
                  return (
                    <p
                      className={`text-xs font-medium flex items-center gap-1 ${isShared ? "bg-primary/10 text-primary rounded-md px-2 py-0.5" : "text-muted-foreground"}`}
                    >
                      <span>💡</span> {reason}
                    </p>
                  );
                })()}
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.52 0.22 260), oklch(0.65 0.14 188))",
              }}
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
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-safe-area-inset-bottom bg-white dark:bg-background border-t border-border dark:border-border py-3 transition-colors duration-300">
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

// ---- APP ----
export default function App() {
  const [filterSport, setFilterSport] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const createSectionRef = useRef<HTMLElement>(null);
  const { isDark, toggleDark } = useDarkMode();
  const { loginStatus, identity } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;
  const callerPrincipal =
    isLoggedIn && identity ? identity.getPrincipal().toString() : "";
  const { notifications, unreadCount, markAllRead, clearAll } =
    useNotifications(isLoggedIn, callerPrincipal);
  const { mutate: doRegisterMe } = useRegisterMe();
  const registeredRef = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: doRegisterMe is stable
  useEffect(() => {
    if (isLoggedIn && !registeredRef.current) {
      registeredRef.current = true;
      doRegisterMe();
    }
    if (!isLoggedIn) {
      registeredRef.current = false;
    }
  }, [isLoggedIn]);

  function handleSearch(sport: string, location: string) {
    setFilterSport(sport);
    setFilterLocation(location);
  }

  function scrollToCreate() {
    createSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen flex flex-col pb-16 sm:pb-0 bg-background text-foreground transition-colors duration-300">
      <Toaster position="top-right" />
      <Header
        onCreateClick={scrollToCreate}
        onProfileClick={() => setProfileOpen(true)}
        isDark={isDark}
        toggleDark={toggleDark}
        notifications={notifications}
        unreadCount={unreadCount}
        markAllRead={markAllRead}
        clearAll={clearAll}
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
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
      >
        <HeroSection onSearch={handleSearch} />
        {isLoggedIn && identity && <TodayMatchesSection identity={identity} />}
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
