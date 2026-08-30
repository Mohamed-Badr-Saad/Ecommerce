import { describe, expect, it } from "vitest";

import { PayloadTooLargeError, readBoundedText } from "./bounded-body";

describe("readBoundedText", () => {
  it("reads an accepted body without a content-length header", async () => {
    const request = new Request("https://example.test/webhook", { method: "POST", body: "hello", duplex: "half" } as RequestInit);
    await expect(readBoundedText(request, 5)).resolves.toBe("hello");
  });

  it("rejects a stream as soon as its byte limit is crossed", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("1234"));
        controller.enqueue(new TextEncoder().encode("56"));
        controller.close();
      },
    });
    const request = new Request("https://example.test/webhook", { method: "POST", body: stream, duplex: "half" } as RequestInit);
    await expect(readBoundedText(request, 5)).rejects.toBeInstanceOf(PayloadTooLargeError);
  });

  it("counts UTF-8 bytes rather than JavaScript characters", async () => {
    const request = new Request("https://example.test/webhook", { method: "POST", body: "ééé", duplex: "half" } as RequestInit);
    await expect(readBoundedText(request, 5)).rejects.toBeInstanceOf(PayloadTooLargeError);
  });
});
