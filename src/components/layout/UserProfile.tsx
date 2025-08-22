import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  Settings, 
  LogOut,
  ChevronDown
} from "lucide-react";

// Mock user data - في التطبيق الحقيقي ستأتي من useAuth
const mockUser = {
  name: "د. أحمد محمد",
  position: "طبيب أسنان رئيسي",
  email: "ahmed@clinic.com",
  avatar: null
};

export function UserProfile() {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    // Handle logout logic here
    console.log("Logging out...");
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-auto p-2 hover:bg-accent"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={mockUser.avatar || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getInitials(mockUser.name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium text-foreground">
              {mockUser.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {mockUser.position}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
        <div className="flex items-center gap-2 p-2">
          <Avatar className="w-10 h-10">
            <AvatarImage src={mockUser.avatar || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(mockUser.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm text-foreground">
              {mockUser.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {mockUser.position}
            </span>
            <span className="text-xs text-muted-foreground">
              {mockUser.email}
            </span>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span>الملف الشخصي</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <span>الإعدادات</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="flex items-center gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}