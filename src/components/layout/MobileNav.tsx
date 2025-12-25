import { Link, useLocation } from "react-router-dom";
import { BookOpen, Library, BookA, Plus, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Library", icon: BookOpen },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/add", label: "Add", icon: Plus, highlight: true },
  { href: "/collections", label: "Collections", icon: Library },
  { href: "/vocabulary", label: "Vocabulary", icon: BookA },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                item.highlight
                  ? "text-primary-foreground bg-primary rounded-full p-3 -mt-4 shadow-lg"
                  : isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", item.highlight && "h-6 w-6")} />
              {!item.highlight && <span className="text-xs">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
