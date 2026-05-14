import {
  UtensilsCrossed, Car, ShoppingBag, Tv, Heart, Home, Zap, GraduationCap,
  Plane, Sparkles, RefreshCw, Shield, PiggyBank, MoreHorizontal,
  Briefcase, Laptop, TrendingUp, Building2, Gift, Plus, DollarSign,
  Coffee, Utensils, Wine, Pizza, ShoppingCart, Package, Tag, Box,
  Bike, Bus, Train, Ship, Music, Headphones, Gamepad2, Film, BookOpen,
  Activity, Dumbbell, Pill, Wifi, Wrench, Lamp, Phone, CreditCard, Wallet,
  Star, Smile, Camera, Watch, Sun, Moon, Globe, Leaf, Bell, Bookmark,
  type LucideIcon,
} from 'lucide-react';

export const iconMap: Record<string, LucideIcon> = {
  UtensilsCrossed, Car, ShoppingBag, Tv, Heart, Home, Zap, GraduationCap,
  Plane, Sparkles, RefreshCw, Shield, PiggyBank, MoreHorizontal,
  Briefcase, Laptop, TrendingUp, Building2, Gift, Plus, DollarSign,
  Coffee, Utensils, Wine, Pizza, ShoppingCart, Package, Tag, Box,
  Bike, Bus, Train, Ship, Music, Headphones, Gamepad2, Film, BookOpen,
  Activity, Dumbbell, Pill, Wifi, Wrench, Lamp, Phone, CreditCard, Wallet,
  Star, Smile, Camera, Watch, Sun, Moon, Globe, Leaf, Bell, Bookmark,
};

interface Props {
  icon: string;
  color: string;
  size?: number;
}

export default function CategoryIcon({ icon, color, size = 18 }: Props) {
  const Icon = iconMap[icon] || DollarSign;
  return (
    <div
      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{ background: color + '20' }}
    >
      <Icon size={size} color={color} strokeWidth={1.8} />
    </div>
  );
}

export function CategoryIconRaw({ icon, color, size = 16 }: Props) {
  const Icon = iconMap[icon] || DollarSign;
  return <Icon size={size} color={color} strokeWidth={1.8} />;
}
