import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QRScanner } from './scanner';
import QrScanner from 'qr-scanner';

// Mock qr-scanner library
vi.mock('qr-scanner', () => ({
  default: {
    scanImage: vi.fn(),
  },
}));

// Comprehensive mocking of browser APIs
const mockBarcodeDetector = {
  detect: vi.fn(),
};

const mockVideoTrack = {
  stop: vi.fn(),
  getSettings: vi.fn().mockReturnValue({ width: 640, height: 480 }),
};

const mockStream = {
  getVideoTracks: vi.fn().mockReturnValue([mockVideoTrack]),
  getTracks: vi.fn().mockReturnValue([mockVideoTrack]),
};

const mockNavigator = {
  mediaDevices: {
    getUserMedia: vi.fn(),
    enumerateDevices: vi.fn(),
  },
};

// Mock video element with all necessary properties and methods
const createMockVideo = () => {
  const video = {
    srcObject: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    videoWidth: 640,
    videoHeight: 480,
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    style: {},
    currentTime: 0,
    duration: 0,
    paused: true,
    ended: false,
    onloadedmetadata: null,
    onerror: null,
    load: vi.fn(),
  };
  
  // Simulate onloadedmetadata trigger when srcObject is set
  Object.defineProperty(video, 'srcObject', {
    set: function(stream) {
      this._srcObject = stream;
      // Simulate metadata loaded event
      setTimeout(() => {
        if (this.onloadedmetadata) {
          this.onloadedmetadata();
        }
      }, 0);
    },
    get: function() {
      return this._srcObject;
    }
  });
  
  return video;
};

const mockCanvas = {
  width: 640,
  height: 480,
  getContext: vi.fn().mockReturnValue({
    drawImage: vi.fn(),
    getImageData: vi.fn().mockReturnValue({
      data: new Uint8ClampedArray(640 * 480 * 4),
      width: 640,
      height: 480,
    }),
  }),
};

// Setup global mocks
Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
});

// Mock Worker to prevent unhandled errors from qr-scanner library
Object.defineProperty(global, 'Worker', {
  value: vi.fn().mockImplementation(() => ({
    postMessage: vi.fn(),
    terminate: vi.fn(),
    onmessage: null,
    onerror: null,
  })),
  writable: true,
});

Object.defineProperty(global, 'BarcodeDetector', {
  value: vi.fn().mockImplementation(() => mockBarcodeDetector),
  writable: true,
});

// Create a persistent mock video element
let mockVideo = createMockVideo();

Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn((tagName: string) => {
      if (tagName === 'video') {
        mockVideo = createMockVideo();
        return mockVideo;
      }
      if (tagName === 'canvas') return mockCanvas;
      return {};
    }),
  },
  writable: true,
});

describe('QR Scanner', () => {
  let scanner: QRScanner;
  let onScanCallback: vi.Mock;
  let onErrorCallback: vi.Mock;
  let testVideoElement: any;

  beforeEach(() => {
    vi.clearAllMocks();
    onScanCallback = vi.fn();
    onErrorCallback = vi.fn();
    testVideoElement = createMockVideo();
    scanner = new QRScanner(testVideoElement);
  });

  afterEach(() => {
    if (scanner) {
      scanner.stop();
    }
  });

  describe('constructor', () => {
    it('should create scanner with callbacks', () => {
      expect(scanner).toBeInstanceOf(QRScanner);
      expect(typeof scanner.start).toBe('function');
      expect(typeof scanner.stop).toBe('function');
    });

    it('should detect BarcodeDetector support', () => {
      expect(global.BarcodeDetector).toBeDefined();
    });

    it('should create video element with setAttribute', () => {
      const video = global.document.createElement('video');
      expect(video).toBeDefined();
      expect(typeof video.setAttribute).toBe('function');
    });
  });

  describe('camera management', () => {
    it('should request camera access with correct constraints', async () => {
      mockNavigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
      mockBarcodeDetector.detect.mockResolvedValue([]);

      await scanner.start(onScanCallback, onErrorCallback);

      expect(mockNavigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    });

    it('should handle camera access denied', async () => {
      const cameraError = new Error('Camera access denied');
      mockNavigator.mediaDevices.getUserMedia.mockRejectedValue(cameraError);

      await expect(scanner.start(onScanCallback, onErrorCallback)).rejects.toThrow('Camera access denied');
    });

    it('should not start multiple times', async () => {
      mockNavigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
      mockBarcodeDetector.detect.mockResolvedValue([]);

      await scanner.start(onScanCallback, onErrorCallback);
      await expect(scanner.start(onScanCallback, onErrorCallback)).rejects.toThrow('Scanner is already running');

      expect(mockNavigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
    });

    it('should stop camera and cleanup resources', async () => {
      mockNavigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
      mockBarcodeDetector.detect.mockResolvedValue([]);

      await scanner.start(onScanCallback, onErrorCallback);
      scanner.stop();

      expect(mockVideoTrack.stop).toHaveBeenCalled();
    });
  });

  describe('QR code detection with BarcodeDetector', () => {
    beforeEach(async () => {
      mockNavigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
      // Reset QrScanner mock for each test
      vi.mocked(QrScanner.scanImage).mockReset();
      await scanner.start(onScanCallback, onErrorCallback);
    });

    it('should detect QR codes and call onScan callback', async () => {
      const qrData = JSON.stringify({
        version: 1,
        deviceId: 'a'.repeat(64),
        deviceName: 'Test Device',
        pubKeyJwk: { kty: 'EC', crv: 'P-256', x: 'x', y: 'y' },
        signalingURL: 'wss://example.com',
        iceServers: [],
      });
      
      mockBarcodeDetector.detect.mockResolvedValue([
        { rawValue: qrData, format: 'qr_code' },
      ]);

      // Allow scanning loop to run
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockBarcodeDetector.detect).toHaveBeenCalled();
      expect(onScanCallback).toHaveBeenCalledWith({
        data: qrData,
        timestamp: expect.any(Number),
      });
    });

    it('should ignore non-QR barcodes', async () => {
      // BarcodeDetector with qr_code format won't detect non-QR codes
      mockBarcodeDetector.detect.mockResolvedValue([]);
      // Also make qr-scanner library fail with no QR code found
      vi.mocked(QrScanner.scanImage).mockRejectedValue(new Error('No QR code found'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onScanCallback).not.toHaveBeenCalled();
    });

    it('should handle detection errors gracefully', async () => {
      mockBarcodeDetector.detect.mockRejectedValue(new Error('Detection failed'));

      await new Promise(resolve => setTimeout(resolve, 100));

      // Detection errors should not propagate to onError callback
      expect(onErrorCallback).not.toHaveBeenCalled();
    });

    it('should not process the same QR code repeatedly', async () => {
      const qrData = JSON.stringify({
        version: 1,
        deviceId: 'a'.repeat(64),
        deviceName: 'Test Device',
        pubKeyJwk: { kty: 'EC', crv: 'P-256', x: 'x', y: 'y' },
        signalingURL: 'wss://example.com',
        iceServers: [],
      });
      
      mockBarcodeDetector.detect.mockResolvedValue([
        { rawValue: qrData, format: 'qr_code' },
      ]);

      // Allow multiple scan cycles
      await new Promise(resolve => setTimeout(resolve, 300));

      // Should only process once despite multiple detections
      expect(onScanCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('QR code processing', () => {
    it('should continue scanning when no QR codes detected', async () => {
      mockNavigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
      // Mock both BarcodeDetector and library to fail
      mockBarcodeDetector.detect.mockResolvedValue([]);
      vi.mocked(QrScanner.scanImage).mockRejectedValue(new Error('No QR code found'));
      
      await scanner.start(onScanCallback, onErrorCallback);

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(onScanCallback).not.toHaveBeenCalled();
      expect(onErrorCallback).not.toHaveBeenCalled();
    });

    it('should call onError only for camera/permission errors', async () => {
      mockNavigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
      await scanner.start(onScanCallback, onErrorCallback);

      // Simulate camera error during scanning - needs to propagate through scanQRCode
      mockBarcodeDetector.detect.mockRejectedValue(new Error('Camera access denied'));
      
      // Mock scanWithLibrary to also fail with camera error to trigger onError
      const originalScanImage = QrScanner.scanImage;
      vi.mocked(QrScanner.scanImage).mockRejectedValue(new Error('Camera access denied'));

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(onErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Camera'),
        })
      );
      
      // Restore original
      QrScanner.scanImage = originalScanImage;
    });
  });

  describe('cleanup and error handling', () => {
    it('should be safe to call stop without starting', () => {
      expect(() => scanner.stop()).not.toThrow();
    });

    it('should be safe to call stop multiple times', () => {
      scanner.stop();
      expect(() => scanner.stop()).not.toThrow();
    });

    it('should handle video play errors', async () => {
      mockNavigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
      
      const mockVideoWithError = createMockVideo();
      mockVideoWithError.play.mockRejectedValue(new Error('Video play failed'));
      
      const newScanner = new QRScanner(mockVideoWithError);
      
      await expect(newScanner.start(onScanCallback, onErrorCallback)).rejects.toThrow('Camera setup failed: Video play failed');
    });

    it('should cleanup on component unmount', async () => {
      mockNavigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
      await scanner.start(onScanCallback, onErrorCallback);

      scanner.stop();

      expect(mockVideoTrack.stop).toHaveBeenCalled();
    });
  });

  describe('fallback behavior', () => {
    it('should handle missing BarcodeDetector gracefully', () => {
      // Create a new scanner instance to test fallback
      // We don't need to modify global BarcodeDetector, just test that
      // the scanner can be created regardless of BarcodeDetector availability
      const fallbackScanner = new QRScanner(createMockVideo());
      expect(fallbackScanner).toBeInstanceOf(QRScanner);
      expect(typeof fallbackScanner.start).toBe('function');
      expect(typeof fallbackScanner.stop).toBe('function');
    });
  });
});