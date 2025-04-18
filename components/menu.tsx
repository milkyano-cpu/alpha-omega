"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export function Menu() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  // Only show authenticated content after mounting on client
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleLogout = () => {
    logout();
    // No need to redirect - the auth context will update state
  };
  
  return (
    <NavigationMenu className="w-full">
      <NavigationMenuList>
        <NavigationMenuItem className="ml-auto hidden md:block">
          {!mounted ? (
            // Server-side and initial render placeholder  
            <Link href="/login" className={navigationMenuTriggerStyle()}>
              LOGIN
            </Link>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-sm">
                Hello, {user?.first_name || 'User'}
              </span>
              <Link href="#" onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }} className={navigationMenuTriggerStyle()}>
                LOGOUT
              </Link>
            </div>
          ) : (
            <Link href="/login" className={navigationMenuTriggerStyle()}>
              LOGIN
            </Link>
          )}
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <svg
              className="w-7"
              viewBox="0 0 32 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M24.4706 19.9413H7.5M24.4706 13.9706H7.5M24.4706 7.99994H7.5"
                stroke="#000000"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6">
              <ListItem href="/" title="HOME"></ListItem>
              <ListItem href="/about-us" title="ABOUT US"></ListItem>
              <ListItem href="/testimonials" title="TESTIMONIALS"></ListItem>
              <ListItem href="/contacts" title="CONTACTS"></ListItem>
              <ListItem href="/gallery" title="GALLERY"></ListItem>
              <ListItem href="/barbers" title="BARBERS"></ListItem>
              <ListItem href="/services" title="SERVICES"></ListItem>
              <ListItem href="/careers" title="CAREERS"></ListItem>
              
              {/* Authentication Links */}
              <div className="pt-4 mt-4 border-t border-gray-200">
                {!mounted ? (
                  // Server-side placeholder - always show login/signup
                  <>
                    <ListItem href="/login" title="LOGIN" />
                    <ListItem href="/signup" title="SIGN UP" />
                  </>
                ) : isAuthenticated ? (
                  <>
                    <div className="mb-3 text-sm font-medium px-3">
                      Logged in as {user?.first_name || 'User'}
                    </div>
                    <li>
                      <Link
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleLogout();
                        }}
                        className="block select-none space-y-1 rounded-md p-3 w-full text-left leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">LOGOUT</div>
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <ListItem href="/login" title="LOGIN" />
                    <ListItem href="/signup" title="SIGN UP" />
                  </>
                )}
              </div>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<typeof Link>,
  Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'> & {
    className?: string;
    title: string;
  }
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref as any}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
