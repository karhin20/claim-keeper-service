import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { UserCircle, LogOut, Settings, Key } from "lucide-react";

export function UserMenu() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          <UserCircle className="h-5 w-5 mr-2" />
          {session?.user?.user_metadata?.name || session?.user?.email}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-white shadow-lg border" align="end">
        <DropdownMenuLabel className="font-semibold">My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="hover:bg-gray-100" onClick={() => navigate("/dashboard")}>
          <Key className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-gray-100" onClick={() => navigate("/claims")}>
          <Key className="mr-2 h-4 w-4" />
          All Claims
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-gray-100" onClick={() => navigate("/verify-claims")}>
          <Key className="mr-2 h-4 w-4" />
          Verify Claims
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-gray-100" onClick={() => navigate("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="hover:bg-gray-100" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 