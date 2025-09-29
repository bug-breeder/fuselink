export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "FuseLink",
  description: "Peer-to-peer file synchronization across your devices.",
  navItems: [
    {
      label: "Dashboard",
      href: "/",
    },
    {
      label: "Devices",
      href: "/devices",
    },
    {
      label: "Settings",
      href: "/settings",
    },
  ],
  navMenuItems: [
    {
      label: "Dashboard",
      href: "/",
    },
    {
      label: "Devices",
      href: "/devices",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Help & Support",
      href: "/help",
    },
  ],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
