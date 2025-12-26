import { Link, useLocation } from "react-router-dom";
import { BookOpen, Library, BookA, Plus, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const leftNavItems = [
  { href: "/", label: "Library", icon: BookOpen },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
];

const rightNavItems = [
  { href: "/collections", label: "Collections", icon: Library },
  { href: "/vocabulary", label: "Vocabulary", icon: BookA },
];

export function MobileNav() {
  const location = useLocation();

  const renderNavItem = (item: { href: string; label: string; icon: typeof BookOpen }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href;
    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
        <span className="text-xs">{item.label}</span>
      </Link>
    );
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="relative flex items-center h-16 px-2">
        {/* Left nav items */}
        <div className="flex-1 flex justify-evenly">
          {leftNavItems.map(renderNavItem)}
        </div>

        {/* Center spacer for the floating button */}
        <div className="w-14" />

        {/* Right nav items */}
        <div className="flex-1 flex justify-evenly">
          {rightNavItems.map(renderNavItem)}
        </div>

        {/* Centered Add button */}
        <Link
          to="/add"
          className="absolute left-1/2 -translate-x-1/2 -top-4 flex items-center justify-center text-primary-foreground bg-primary rounded-full p-3 shadow-lg transition-transform hover:scale-105"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </div>
    </nav>
  );
}
