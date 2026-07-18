class NoopSignal {
  add(): void {
    // Phaser only reaches this in debug builds; production aliases it here to
    // avoid bundling the optional Spector WebGL inspector.
  }
}

export class Spector {
  readonly onCapture = new NoopSignal();

  captureCanvas(): void {}
  startCapture(): void {}
  stopCapture(): undefined {
    return undefined;
  }
  getResultUI(): { display: () => void } {
    return { display: () => undefined };
  }
  getFps(): undefined {
    return undefined;
  }
  log(): string {
    return '';
  }
}

export default { Spector };
