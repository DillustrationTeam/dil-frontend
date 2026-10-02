'use client';

import { useCallback, useState } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';

interface ImageCropModalProps {
  imageSrc: string;
  aspect: number;
  crop: Point;
  zoom: number;
  rotation: number;
  onCropChange: (crop: Point) => void;
  onZoomChange: (zoom: number) => void;
  onRotationChange: (rotation: number) => void;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

export function ImageCropModal({
  imageSrc,
  aspect,
  crop,
  zoom,
  rotation,
  onCropChange,
  onZoomChange,
  onRotationChange,
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, rotation);
      onConfirm(blob);
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#1F2335] p-5">
        <p className="mb-4 text-sm font-semibold text-white">Cắt ảnh</p>

        <div className="relative h-80 w-full overflow-hidden rounded-2xl bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={aspect === 1 ? 'round' : 'rect'}
            showGrid={aspect !== 1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onRotationChange={onRotationChange}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-12 text-xs text-[#C7C5CF]">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(event) => onZoomChange(Number(event.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-12 text-xs text-[#C7C5CF]">Xoay</span>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(event) => onRotationChange(Number(event.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-[#C7C5CF] transition hover:border-white/30"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing || !croppedAreaPixels}
            className="rounded-xl bg-[#A7ACD9] px-4 py-2 text-sm font-bold text-[#1F2335] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessing ? 'Đang xử lý...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Thuật toán cắt ảnh chuẩn theo tài liệu react-easy-crop: vẽ ảnh đã xoay vào canvas đủ lớn
// chứa trọn bounding box sau khi xoay, rồi lấy đúng vùng pixelCrop (đã tính theo canvas đó) ra ảnh cuối.
function getRadianAngle(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function getRotatedBoundingBox(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('Failed to load image.')));
    image.src = src;
  });
}

async function getCroppedImageBlob(imageSrc: string, pixelCrop: Area, rotation: number): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas is not supported.');
  }

  const rotRad = getRadianAngle(rotation);
  const { width: boxWidth, height: boxHeight } = getRotatedBoundingBox(image.width, image.height, rotation);

  canvas.width = boxWidth;
  canvas.height = boxHeight;

  ctx.translate(boxWidth / 2, boxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.putImageData(data, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to crop image.'));
      },
      'image/jpeg',
      0.92
    );
  });
}
