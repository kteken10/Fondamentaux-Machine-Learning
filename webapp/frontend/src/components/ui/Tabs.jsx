import * as RT from "@radix-ui/react-tabs";
import { cn } from "../../lib/cn";

export const Tabs = RT.Root;

export function TabsList({ className, ...props }) {
  return (
    <RT.List
      className={cn("inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }) {
  return (
    <RT.Trigger
      className={cn(
        "px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 transition-colors",
        "data-[state=active]:bg-white data-[state=active]:text-accent-700 data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }) {
  return <RT.Content className={cn("mt-5 focus:outline-none", className)} {...props} />;
}
