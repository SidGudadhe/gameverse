import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('CrazyGames-Style Sidebar Navigation (100x Deep Analysis)', () => {
  const navbarPath = path.resolve(__dirname, '../src/components/Navbar.tsx');
  const sidebarPath = path.resolve(__dirname, '../src/components/GamerSidebar.tsx');
  const layoutPath = path.resolve(__dirname, '../src/app/layout.tsx');
  const wrapperPath = path.resolve(__dirname, '../src/components/PlayerContentWrapper.tsx');
  const contextPath = path.resolve(__dirname, '../src/context/SidebarContext.tsx');

  it('1. Top Navbar should NOT have horizontal page changing links in Player Website', () => {
    const navbarContent = fs.readFileSync(navbarPath, 'utf-8');

    // In Portal C (Player Gaming Website Navbar), top nav must not contain horizontal page links
    expect(navbarContent).not.toContain('aria-label="Player navigation"');
    expect(navbarContent).not.toContain('<span>All Games</span>');
    expect(navbarContent).not.toContain('<span>Categories</span>');
    expect(navbarContent).not.toContain('<span>Favorites</span>');
    expect(navbarContent).not.toContain('<span>History</span>');
    expect(navbarContent).not.toContain('<span>Payouts</span>');

    // Top navbar must have CrazyGames sidebar toggle button
    expect(navbarContent).toContain('toggleCollapse');
    expect(navbarContent).toContain('toggleMobile');
  });

  it('2. GamerSidebar should hold all Page changing options on the side ("sirf pages vala")', () => {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');

    // All primary pages are present in the side navigation
    expect(sidebarContent).toContain("label: 'All Games'");
    expect(sidebarContent).toContain("href: '/'");

    expect(sidebarContent).toContain("label: 'Categories'");
    expect(sidebarContent).toContain("href: '/category'");

    expect(sidebarContent).toContain("label: 'Favorites'");
    expect(sidebarContent).toContain("href: '/player/favorites'");

    expect(sidebarContent).toContain("label: 'Play History'");
    expect(sidebarContent).toContain("href: '/player/history'");

    expect(sidebarContent).toContain("label: 'Gamer Payouts'");
    expect(sidebarContent).toContain("href: '/player/payouts'");
  });

  it('3. GamerSidebar should support both Expanded (w-56) and Collapsed (w-18) CrazyGames rail modes', () => {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');

    expect(sidebarContent).toContain("isCollapsed ? 'w-18' : 'w-56'");
    expect(sidebarContent).toContain('toggleCollapse');
    expect(sidebarContent).toContain('ChevronLeft');
    expect(sidebarContent).toContain('ChevronRight');
  });

  it('4. GamerSidebar should include CrazyGames quick genre shortcuts', () => {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');

    expect(sidebarContent).toContain('/category/action');
    expect(sidebarContent).toContain('/category/arcade');
    expect(sidebarContent).toContain('/category/puzzle');
    expect(sidebarContent).toContain('/category/strategy');
    expect(sidebarContent).toContain('/category/sports');
    expect(sidebarContent).toContain('/category/casual');
    expect(sidebarContent).toContain('/category/rpg');
  });

  it('5. PlayerContentWrapper should dynamically pad desktop content for the side navigation', () => {
    const wrapperContent = fs.readFileSync(wrapperPath, 'utf-8');

    expect(wrapperContent).toContain("isCollapsed ? 'md:pl-18' : 'md:pl-56'");
    expect(wrapperContent).toContain('isPlayerPortal');
  });

  it('6. RootLayout should provide SidebarProvider and mount GamerSidebar & PlayerContentWrapper', () => {
    const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

    expect(layoutContent).toContain('<SidebarProvider>');
    expect(layoutContent).toContain('<GamerSidebar />');
    expect(layoutContent).toContain('<PlayerContentWrapper>');
  });

  it('7. SidebarContext should remember collapse preferences in localStorage and close mobile drawer on route change', () => {
    const contextContent = fs.readFileSync(contextPath, 'utf-8');

    expect(contextContent).toContain('gv_sidebar_collapsed');
    expect(contextContent).toContain('setIsMobileOpen(false)');
  });
});
