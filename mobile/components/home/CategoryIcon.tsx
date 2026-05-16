import { View } from 'react-native';
import {
  Coffee, Utensils, UtensilsCrossed, Wine, Pizza,
  ShoppingCart, ShoppingBag, Package, Tag, Box,
  Car, Bike, Bus, Train, Plane, Ship,
  Music, Headphones, Gamepad2, Film, Tv, BookOpen,
  Heart, Activity, Dumbbell, Pill,
  Home, Wifi, Wrench, Zap, Lamp,
  GraduationCap, BookMarked, Pencil,
  Globe, Map, Compass,
  Sparkles, Scissors, Bath,
  RefreshCw, Shield, PiggyBank, TrendingUp,
  MoreHorizontal, Star, DollarSign, Plus,
  Briefcase, Laptop, Building2, Gift,
  Phone, CreditCard, Wallet, Smile, Camera, Watch, Sun, Moon, Leaf, Bell, Bookmark,
  type LucideProps,
} from 'lucide-react-native';

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Coffee, Utensils, UtensilsCrossed, Wine, Pizza,
  ShoppingCart, ShoppingBag, Package, Tag, Box,
  Car, Bike, Bus, Train, Plane, Ship,
  Music, Headphones, Gamepad2, Film, Tv, BookOpen,
  Heart, Activity, Dumbbell, Pill,
  Home, Wifi, Wrench, Zap, Lamp,
  GraduationCap, BookMarked, Pencil,
  Globe, Map, Compass,
  Sparkles, Scissors, Bath,
  RefreshCw, Shield, PiggyBank, TrendingUp,
  MoreHorizontal, Star, DollarSign, Plus,
  Briefcase, Laptop, Building2, Gift,
  Phone, CreditCard, Wallet, Smile, Camera, Watch, Sun, Moon, Leaf, Bell, Bookmark,
};

interface Props {
  icon: string;
  color: string;
  size?: number;
  showBackground?: boolean;
}

export default function CategoryIcon({ icon, color, size = 20, showBackground = true }: Props) {
  const IconComponent = ICON_MAP[icon] ?? Star;
  const bg = color + '25'; // ~15% opacity background

  if (!showBackground) {
    return <IconComponent size={size} color={color} strokeWidth={1.8} />;
  }

  return (
    <View
      style={{
        width: size * 2.2,
        height: size * 2.2,
        borderRadius: size * 1.1,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <IconComponent size={size} color={color} strokeWidth={1.8} />
    </View>
  );
}

export function CategoryIconRaw({ icon, color, size = 20 }: { icon: string; color: string; size?: number }) {
  const IconComponent = ICON_MAP[icon] ?? Star;
  return <IconComponent size={size} color={color} strokeWidth={1.8} />;
}
