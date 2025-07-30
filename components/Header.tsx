import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getOptimizedProfileImageForUser, handleProfileImageError } from "@/lib/utils";

interface HeaderProps {
  session: any;
  onSignIn: () => void;
  onSignOut: () => void;
  userMapping?: Record<string, { email: string; color?: string }>;
  adminMode?: boolean;
}

export default function Header({ session, onSignIn, onSignOut, userMapping, adminMode = false }: HeaderProps) {
  const loggedInUser = session?.user;
  return (
    <div className="bg-white border-b border-orange-200 sticky top-0 z-50">
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/optimized/summerHoopsLogo.png" alt="Summer Hoops Logo" className="w-12 h-12 rounded-full" />
            <div>
              <h1
                className="text-2xl font-extrabold bg-gradient-to-r from-[#4CAF50] via-[#FFD600] to-[#FB8C00] bg-clip-text text-transparent drop-shadow-sm"
                style={{ letterSpacing: '0.03em' }}
              >
                Summer Hoops
              </h1>
              {!loggedInUser && (
                <p className="text-xs text-gray-500">Please log in</p>
              )}
              {adminMode && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-medium">
                    🔧 Admin Mode
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {loggedInUser ? (
              <>
                <Avatar className="w-8 h-8">
                  <AvatarImage 
                    src={getOptimizedProfileImageForUser(loggedInUser.email, userMapping || {})} 
                    alt={loggedInUser.name || "User"} 
                    onError={(e) => handleProfileImageError(e)} 
                  />
                  <AvatarFallback>
                    {loggedInUser.name
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <Button size="sm" variant="outline" onClick={onSignOut}>Logout</Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={onSignIn}>Login with Google</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 