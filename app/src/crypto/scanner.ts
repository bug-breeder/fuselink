// QR code scanning with BarcodeDetector and fallback library

import QrScanner from 'qr-scanner';

export interface ScanResult {
  data: string;
  timestamp: number;
}

export interface ScannerOptions {
  preferredCamera?: 'front' | 'back';
  maxScanTime?: number; // Maximum time to scan in ms
  highlightScanRegion?: boolean;
  highlightCodeOutline?: boolean;
}

/**
 * Check if BarcodeDetector is available in the browser
 */
export function isBarcodeDetectorSupported(): boolean {
  return 'BarcodeDetector' in window;
}

/**
 * Scan QR code using native BarcodeDetector API (when available)
 */
export async function scanWithBarcodeDetector(
  video: HTMLVideoElement,
  _options: ScannerOptions = {}
): Promise<ScanResult> {
  if (!isBarcodeDetectorSupported()) {
    throw new Error('BarcodeDetector is not supported');
  }

  try {
    const barcodeDetector = new (window as any).BarcodeDetector({
      formats: ['qr_code']
    });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Detect QR codes in the frame
    const barcodes = await barcodeDetector.detect(canvas);
    
    if (barcodes.length === 0) {
      throw new Error('No QR code detected in frame');
    }

    // Return the first QR code found
    return {
      data: barcodes[0].rawValue,
      timestamp: Date.now(),
    };
  } catch (error) {
    throw new Error(`BarcodeDetector scanning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Scan QR code using fallback library (qr-scanner)
 */
export async function scanWithLibrary(
  video: HTMLVideoElement,
  _options: ScannerOptions = {}
): Promise<ScanResult> {
  try {
    const result = await QrScanner.scanImage(video);

    return {
      data: result,
      timestamp: Date.now(),
    };
  } catch (error) {
    throw new Error(`QR Scanner library failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Universal QR scanner that tries BarcodeDetector first, falls back to library
 */
export async function scanQRCode(
  video: HTMLVideoElement,
  options: ScannerOptions = {}
): Promise<ScanResult> {
  // Try native BarcodeDetector first
  if (isBarcodeDetectorSupported()) {
    try {
      return await scanWithBarcodeDetector(video, options);
    } catch (error) {
      console.warn('BarcodeDetector failed, falling back to library:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Fallback to library
  return await scanWithLibrary(video, options);
}

/**
 * Set up camera stream for QR scanning
 */
export async function setupCameraStream(
  videoElement: HTMLVideoElement,
  options: ScannerOptions = {}
): Promise<MediaStream> {
  try {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: options.preferredCamera === 'front' ? 'user' : 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    videoElement.srcObject = stream;
    videoElement.setAttribute('playsinline', 'true'); // Required for iOS
    
    await new Promise<void>((resolve, reject) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play()
          .then(() => resolve())
          .catch(reject);
      };
      videoElement.onerror = reject;
    });

    return stream;
  } catch (error) {
    throw new Error(`Camera setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Stop camera stream and cleanup
 */
export function stopCameraStream(stream: MediaStream): void {
  stream.getTracks().forEach(track => {
    track.stop();
  });
}

/**
 * Continuous QR scanning with callback
 */
export class QRScanner {
  private video: HTMLVideoElement;
  private stream: MediaStream | null = null;
  private scanning = false;
  private scanInterval: number | null = null;

  constructor(videoElement: HTMLVideoElement) {
    this.video = videoElement;
  }

  /**
   * Start continuous scanning
   */
  async start(
    onScan: (result: ScanResult) => void,
    onError: (error: Error) => void,
    options: ScannerOptions = {}
  ): Promise<void> {
    if (this.scanning) {
      throw new Error('Scanner is already running');
    }

    try {
      this.stream = await setupCameraStream(this.video, options);
      this.scanning = true;

      // Scan every 100ms
      this.scanInterval = window.setInterval(async () => {
        if (!this.scanning || !this.stream) return;

        try {
          const result = await scanQRCode(this.video, options);
          onScan(result);
          
          // Stop scanning after successful scan
          this.stop();
        } catch (error) {
          // Ignore scanning errors during continuous scanning
          // Only call onError for serious issues
          if ((error instanceof Error && error.message.includes('Camera')) || (error instanceof Error && error.message.includes('permission'))) {
            onError(error as Error);
            this.stop();
          }
        }
      }, 100);

      // Auto-stop after max scan time
      if (options.maxScanTime) {
        setTimeout(() => {
          if (this.scanning) {
            this.stop();
            onError(new Error('Scan timeout reached'));
          }
        }, options.maxScanTime);
      }
    } catch (error) {
      this.scanning = false;
      throw error;
    }
  }

  /**
   * Stop scanning
   */
  stop(): void {
    this.scanning = false;

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    if (this.stream) {
      stopCameraStream(this.stream);
      this.stream = null;
    }

    this.video.srcObject = null;
  }

  /**
   * Check if scanner is currently running
   */
  isScanning(): boolean {
    return this.scanning;
  }
}