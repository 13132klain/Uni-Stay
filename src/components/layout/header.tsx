
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { MenuIcon, HomeIcon, ListIcon, UsersIcon, LifeBuoyIcon, UserPlusIcon, LogInIcon, LogOutIcon, UserCircle, CogIcon, ShieldCheckIcon, HeartIcon, Settings2Icon, Building2Icon } from 'lucide-react'; // Added Building2Icon
import NavLink from './nav-link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/listings', label: 'Listings', icon: ListIcon },
  { href: '/roommate-finder', label: 'Roommate Finder', icon: UsersIcon },
  { href: '/support', label: 'Support', icon: LifeBuoyIcon },
];

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const idTokenResult = await currentUser.getIdTokenResult(true); // Force refresh
          console.log("Header: User ID Token Claims:", idTokenResult.claims); 
          setIsUserAdmin(idTokenResult.claims.admin === true);
           if (idTokenResult.claims.admin !== true) {
             console.warn("Header: User is NOT an admin. Claims:", idTokenResult.claims);
          }
        } catch (error) {
          console.error("Header: Error fetching custom claims:", error);
          setIsUserAdmin(false);
        }
      } else {
        setIsUserAdmin(false);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      setIsUserAdmin(false); 
      router.push('/'); 
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout Failed',
        description: 'An error occurred during logout. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getUserInitials = (displayName?: string | null, email?: string | null): string => {
    if (displayName) {
      const names = displayName.split(' ');
      if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return displayName.substring(0, 2).toUpperCase();
    }
    if (email) {
      const emailNamePart = email.split('@')[0];
      if (emailNamePart.length >= 2) {
        return emailNamePart.substring(0, 2).toUpperCase();
      }
      return email.substring(0,1).toUpperCase();
    }
    return 'U';
  };

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            {/* Placeholder for logo while loading */}
            <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
            <span className="font-bold sm:inline-block text-lg">UniStay</span>
          </Link>
          <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Building2Icon className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block text-lg">UniStay</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => (
            <NavLink key={item.label} href={item.href} icon={item.icon}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                    <AvatarFallback>{getUserInitials(user.displayName, user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none truncate">{user.displayName || user.email || 'User'}</p>
                    {user.displayName && user.email && <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile">
                      <UserCircle className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile/favorites">
                      <HeartIcon className="mr-2 h-4 w-4" />
                      My Favorites
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                {isUserAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Admin Portal</DropdownMenuLabel>
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/portal/manage-bookings">
                          <ShieldCheckIcon className="mr-2 h-4 w-4" />
                          Manage Bookings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/portal/manage-listings">
                          <Settings2Icon className="mr-2 h-4 w-4" />
                          Manage Listings
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive-foreground focus:bg-destructive">
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" asChild className="hidden md:inline-flex">
                <Link href="/auth/login">
                  <LogInIcon className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
              <Button asChild className="hidden md:inline-flex">
                <Link href="/auth/signup">
                  <UserPlusIcon className="mr-2 h-4 w-4" /> Sign Up
                </Link>
              </Button>
            </>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.label}>
                    <NavLink href={item.href} icon={item.icon} className="text-lg p-2 rounded-md hover:bg-muted">
                      {item.label}
                    </NavLink>
                  </SheetClose>
                ))}
                <div className="pt-4 border-t">
                  {user ? (
                    <>
                     <SheetClose asChild>
                        <NavLink href="/profile" icon={UserCircle} className="text-lg p-2 rounded-md hover:bg-muted w-full justify-start mb-2">
                             Profile
                        </NavLink>
                      </SheetClose>
                       <SheetClose asChild>
                        <NavLink href="/profile/favorites" icon={HeartIcon} className="text-lg p-2 rounded-md hover:bg-muted w-full justify-start mb-2">
                             My Favorites
                        </NavLink>
                      </SheetClose>
                      {isUserAdmin && (
                        <>
                          <p className="px-2 py-1 text-sm font-semibold text-muted-foreground">Admin Portal</p>
                          <SheetClose asChild>
                            <NavLink href="/portal/manage-bookings" icon={ShieldCheckIcon} className="text-lg p-2 rounded-md hover:bg-muted w-full justify-start mb-1">
                                 Manage Bookings
                            </NavLink>
                          </SheetClose>
                           <SheetClose asChild>
                            <NavLink href="/portal/manage-listings" icon={Settings2Icon} className="text-lg p-2 rounded-md hover:bg-muted w-full justify-start mb-2">
                                 Manage Listings
                            </NavLink>
                          </SheetClose>
                        </>
                      )}
                      <SheetClose asChild>
                        <Button variant="outline" onClick={handleLogout} className="w-full justify-start text-lg p-2 h-auto hover:bg-destructive hover:text-destructive-foreground">
                            <LogOutIcon className="mr-2 h-5 w-5" /> Log out
                        </Button>
                      </SheetClose>
                    </>
                  ) : (
                    <>
                      <SheetClose asChild>
                        <Button variant="outline" asChild className="w-full justify-start mb-2 text-lg p-2 h-auto">
                          <Link href="/auth/login">
                            <LogInIcon className="mr-2 h-5 w-5" /> Login
                          </Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button asChild className="w-full justify-start text-lg p-2 h-auto">
                          <Link href="/auth/signup">
                            <UserPlusIcon className="mr-2 h-5 w-5" /> Sign Up
                          </Link>
                        </Button>
                      </SheetClose>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
