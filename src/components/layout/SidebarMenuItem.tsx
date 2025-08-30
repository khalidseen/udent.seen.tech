import { NavLink } from "react-router-dom";
import { SidebarMenuItem as BaseSidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { LucideIcon } from "lucide-react";

interface MenuItemProps {
  icon: LucideIcon;
  title: string;
  url: string;
  collapsed: boolean;
  iconSize: string;
  isActive: boolean;
  external?: boolean;
}

export function SidebarMenuItem({ icon: Icon, title, url, collapsed, iconSize, isActive, external }: MenuItemProps) {
  const baseClasses = "w-full flex items-center px-3 py-2 rounded-lg text-[15px] font-medium transition-all duration-150 group";
  const activeClasses = isActive
    ? "bg-primary/90 text-white shadow-md"
    : "hover:bg-primary/10 hover:text-primary";

  return (
    <BaseSidebarMenuItem>
      <SidebarMenuButton asChild className="h-10">
        {external ? (
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`${baseClasses} ${activeClasses}`}
          >
            <div className={`flex items-center w-full ${collapsed ? 'justify-center' : 'gap-3'}`}>
              <Icon className={`${iconSize} text-inherit flex-shrink-0`} />
              {!collapsed && <span className="flex-1 text-right">{title}</span>}
            </div>
          </a>
        ) : (
          <NavLink to={url} className={`${baseClasses} ${activeClasses}`}>
            <div className={`flex items-center w-full ${collapsed ? 'justify-center' : 'gap-3'}`}>
              <Icon className={`${iconSize} text-inherit flex-shrink-0`} />
              {!collapsed && <span className="flex-1 text-right">{title}</span>}
            </div>
          </NavLink>
        )}
      </SidebarMenuButton>
    </BaseSidebarMenuItem>
  );
}
