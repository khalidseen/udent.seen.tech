import { NavLink } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType;
  permissions?: string[];
  external?: boolean;
}

interface AppSidebarItemProps {
  item: MenuItem;
  collapsed: boolean;
  getIconSize: (collapsed: boolean) => string;
}

const getNavClasses = (path: string, isActive: boolean) => {
  const baseClasses = "w-full flex items-center px-3 py-2 rounded-lg text-[15px] font-medium transition-all duration-150 group";
  if (isActive) {
    return `${baseClasses} bg-primary/90 text-white shadow-md`;
  }
  return `${baseClasses} hover:bg-primary/10 hover:text-primary`;
};

export const AppSidebarItem = ({ item, collapsed, getIconSize }: AppSidebarItemProps) => {
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild className="h-10">
        {item.external ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${getNavClasses(item.url, false)} text-blue-600 hover:text-blue-700`}
          >
            <div className="flex items-center w-full">
              <Icon className={`${getIconSize(collapsed)} text-primary group-hover:text-primary-700 transition-colors duration-150 flex-shrink-0 ml-auto`} />
              {!collapsed && (
                <span className="flex-1 text-right mr-3">
                  {item.title}
                  <ExternalLink className="inline-block w-3 h-3 mr-1 opacity-75" />
                </span>
              )}
            </div>
          </a>
        ) : (
          <NavLink to={item.url} className={({ isActive }) => getNavClasses(item.url, isActive)}>
            <div className="flex items-center w-full">
              <Icon className={`${getIconSize(collapsed)} text-primary group-hover:text-primary-700 transition-colors duration-150 flex-shrink-0 ml-auto`} />
              {!collapsed && (
                <span className="flex-1 text-right mr-3">{item.title}</span>
              )}
            </div>
          </NavLink>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};
