import { NavLink } from "@remix-run/react";
import { cn } from "~/lib/utils";
import { 
  LayoutDashboard, 
  MessageSquare, 
  BookOpen, 
  Users, 
  Settings,
  BarChart3,
  ExternalLink
} from "lucide-react";
import { Separator } from "~/components/ui/separator";

interface WorkspaceNavProps {
  workspaceId: string;
  workspaceSlug: string;
}

export function WorkspaceNav({ workspaceId, workspaceSlug }: WorkspaceNavProps) {
  return (
    <nav className="grid items-start gap-2">
      <NavLink
        to={`/workspace/${workspaceId}`}
        className={({ isActive }) =>
          cn(
            "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            isActive ? "bg-accent" : "transparent"
          )
        }
        end
      >
        <LayoutDashboard className="mr-2 h-4 w-4" />
        <span>Dashboard</span>
      </NavLink>
      <NavLink
        to={`/workspace/${workspaceId}/tickets`}
        className={({ isActive }) =>
          cn(
            "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            isActive ? "bg-accent" : "transparent"
          )
        }
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        <span>Tickets</span>
      </NavLink>
      <NavLink
        to={`/workspace/${workspaceId}/kb`}
        className={({ isActive }) =>
          cn(
            "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            isActive ? "bg-accent" : "transparent"
          )
        }
      >
        <BookOpen className="mr-2 h-4 w-4" />
        <span>Knowledge Base</span>
      </NavLink>
      <NavLink
        to={`/workspace/${workspaceId}/metrics`}
        className={({ isActive }) =>
          cn(
            "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            isActive ? "bg-accent" : "transparent"
          )
        }
      >
        <BarChart3 className="mr-2 h-4 w-4" />
        <span>Metrics</span>
      </NavLink>
      <NavLink
        to={`/workspace/${workspaceId}/team`}
        className={({ isActive }) =>
          cn(
            "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            isActive ? "bg-accent" : "transparent"
          )
        }
      >
        <Users className="mr-2 h-4 w-4" />
        <span>Team</span>
      </NavLink>
      <NavLink
        to={`/workspace/${workspaceId}/settings`}
        className={({ isActive }) =>
          cn(
            "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            isActive ? "bg-accent" : "transparent"
          )
        }
      >
        <Settings className="mr-2 h-4 w-4" />
        <span>Settings</span>
      </NavLink>

      <Separator className="my-2" />
      
      <NavLink
        to={`/support/${workspaceSlug}`}
        className={({ isActive }) =>
          cn(
            "group flex items-center rounded-md px-3 py-2 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20",
            isActive ? "bg-primary/20" : "transparent"
          )
        }
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        <span>Customer Portal</span>
      </NavLink>
    </nav>
  );
} 