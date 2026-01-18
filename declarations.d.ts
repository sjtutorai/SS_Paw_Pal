declare module 'jsqr' {
  interface QRCode {
    binaryData: number[];
    data: string;
    chunks: any[];
    location: {
      topLeftCorner: Point;
      topRightCorner: Point;
      bottomRightCorner: Point;
      bottomLeftCorner: Point;
      topRightFinderPattern: Point;
      topLeftFinderPattern: Point;
      bottomLeftFinderPattern: Point;
      bottomRightAlignmentPattern?: Point;
    };
  }

  interface Point {
    x: number;
    y: number;
  }

  interface Options {
    inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst';
  }

  export default function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    providedOptions?: Options
  ): QRCode | null;
}
