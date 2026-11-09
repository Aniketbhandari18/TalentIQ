import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "../ui/sidebar";
import { useUser } from "@clerk/nextjs";
import { useUploadDialog } from "./uploadContext";
import Link from "next/link";
import { InitialsAvatar, Logo } from "../shared/primitives";
import { Briefcase, LayoutGrid, Plus, Upload, Users } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
] as const;

export default function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { user } = useUser();

  const { openUpload } = useUploadDialog();

  const recruiterName = user?.fullName || user?.firstName || "Recruiter";
  const recruiterEmail =
    user?.emailAddresses[0].emailAddress || "recruiter@gmail.com";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-3">
        <Link
          href="/"
          className="flex items-center group-data-[collapsible=icon]:justify-center"
        >
          <Logo className="group-data-[collapsible=icon]:hidden" />
          <Logo
            compact
            className="hidden group-data-[collapsible=icon]:inline-flex"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setOpenMobile(false)}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Upload resumes"
                  onClick={() => {
                    setOpenMobile(false);
                    openUpload();
                  }}
                >
                  <Upload />
                  <span>Upload resumes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Create job">
                  <Link href="/jobs/new" onClick={() => setOpenMobile(false)}>
                    <Plus />
                    <span>Create job</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 rounded-md p-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
          <InitialsAvatar name={recruiterName} className="size-7" />

          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium">{recruiterName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {recruiterEmail}
            </p>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
