
"use client";
import { useState, useRef, type DragEvent } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HiCloudUpload } from "react-icons/hi";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AddFolderModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFolder: (path: string) => void;
};

export function AddFolderModal({ open, onOpenChange, onAddFolder }: AddFolderModalProps) {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [folderPath, setFolderPath] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Note: In a real app, you would need more complex logic 
      // to handle folder paths from drag-and-drop, as browsers
      // don't typically provide the full path for security reasons.
      // We'll simulate it by using the folder name.
      const files = Array.from(e.dataTransfer.files);
      const folder = files.find(file => (file as any).webkitGetAsEntry?.()?.isDirectory);
      setFolderPath(folder ? folder.name : files[0].name);
    }
  };
  
  const handleSelectFolder = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // The path is faked for webkitdirectory
      const path = e.target.files[0].webkitRelativePath.split('/')[0];
      setFolderPath(path);
    }
  }

  const handleAddFolderClick = () => {
    if (!folderPath) {
       toast({
        title: "No folder selected",
        description: "Please select a folder to sync.",
        variant: "destructive"
      });
      return;
    }
    onAddFolder(folderPath);
    onOpenChange(false);
    setFolderPath("");
    toast({
      title: "Folder added",
      description: `"${folderPath}" is now being synced.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setFolderPath("");
        setDragActive(false);
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Folder to Sync</DialogTitle>
          <DialogDescription>
            Drag and drop a folder here or click to browse.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleSelectFolder}
            className={cn(
              "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
              dragActive ? "border-primary bg-muted/50" : "border-border"
            )}
          >
            <HiCloudUpload className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Click to browse</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">Select a folder to start syncing</p>
            <input 
              ref={inputRef}
              type="file"
              className="hidden"
              // @ts-ignore
              webkitdirectory="true" 
              directory="true"
              onChange={handleFileChange}
            />
          </div>
          <div>
            <Label htmlFor="folder-path">Selected Folder</Label>
            <Input id="folder-path" type="text" readOnly value={folderPath} placeholder="No folder selected" className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleAddFolderClick}>Add Folder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
