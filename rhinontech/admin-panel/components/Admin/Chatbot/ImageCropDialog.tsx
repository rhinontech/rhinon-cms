"use client";

import { useRef, useState } from "react";
import ReactCrop, { centerCrop, convertToPixelCrop, makeAspectCrop, type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/Admin/Settings/parts";

/**
 * Crop an image before it is uploaded, as Saleszium's theme editor did.
 * `aspect` locks the shape (1 = square, for the launcher logo); omit it for a
 * free crop. The result is a PNG File, ready for upload.
 */
export function ImageCropDialog({
  src,
  fileName,
  aspect,
  title,
  onCancel,
  onCropped,
}: {
  src: string | null;
  fileName: string;
  aspect?: number;
  title: string;
  onCancel: () => void;
  onCropped: (file: File) => Promise<void>;
}) {
  const img = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [busy, setBusy] = useState(false);

  const onLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(
      aspect
        ? centerCrop(makeAspectCrop({ unit: "%", width: 80 }, aspect, width, height), width, height)
        : { unit: "%", x: 5, y: 5, width: 90, height: 90 }
    );
  };

  const save = async () => {
    const image = img.current;
    if (!image || !crop) return;
    const px = convertToPixelCrop(crop, image.width, image.height);
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(px.width * scaleX));
    canvas.height = Math.max(1, Math.round(px.height * scaleY));
    canvas.getContext("2d")?.drawImage(image, px.x * scaleX, px.y * scaleY, px.width * scaleX, px.height * scaleY, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    setBusy(true);
    try {
      await onCropped(new File([blob], fileName.replace(/\.[^.]+$/, "") + ".png", { type: "image/png" }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!src} onOpenChange={(open) => !open && !busy && onCancel()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Drag to choose the part of the image to use.</DialogDescription>
        </DialogHeader>
        {src && (
          <div className="flex max-h-[60vh] justify-center overflow-auto rounded-lg bg-[repeating-conic-gradient(#e5e7eb_0_25%,transparent_0_50%)] bg-[length:16px_16px]">
            <ReactCrop crop={crop} onChange={(_, percent) => setCrop(percent)} aspect={aspect} keepSelection>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={img} src={src} alt="" onLoad={onLoad} className="max-h-[56vh]" />
            </ReactCrop>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy || !crop} data-testid="crop-save">
            {busy ? <Spinner /> : null} Crop & upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
