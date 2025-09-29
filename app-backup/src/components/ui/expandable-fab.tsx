"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HiPlus, HiFolderAdd, HiDeviceMobile } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface ExpandableFabProps {
  onAddFolder: () => void;
  onAddDevice: () => void;
}

export function ExpandableFab({ onAddFolder, onAddDevice }: ExpandableFabProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button className="h-12 w-12 rounded-full" aria-label="Quick actions">
            <motion.span
              animate={{ rotate: open ? 45 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="inline-block"
            >
              <HiPlus className="h-5 w-5" />
            </motion.span>
          </Button>
        </DropdownMenuTrigger>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
            >
              <DropdownMenuContent align="end" sideOffset={8}>
                <DropdownMenuItem onSelect={onAddDevice}>
                  <HiDeviceMobile className="mr-2 h-4 w-4" />
                  Add Device
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onAddFolder}>
                  <HiFolderAdd className="mr-2 h-4 w-4" />
                  Add Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </motion.div>
          )}
        </AnimatePresence>
      </DropdownMenu>
    </div>
  );
}