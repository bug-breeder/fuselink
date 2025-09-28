import { PairedDevices } from "@/components/dashboard/paired-devices";
import { SyncedFolders } from "@/components/dashboard/synced-folders";
import { Header } from "@/components/layout/header";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary/50 dark:bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="grid gap-8">
            <SyncedFolders />
          </div>
          <div className="grid gap-8">
            <PairedDevices />
          </div>
        </div>
      </main>
    </div>
  );
}
